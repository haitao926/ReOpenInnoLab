import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSession } from '@/database/entities/class-session.entity';
import { ClassMember } from '@/database/entities/class-member.entity';

interface JoinLessonPayload {
  lessonId: string;
  userId: string;
  role: 'teacher' | 'student';
  classroomId: string;
}

interface SectionChangePayload {
  lessonId: string;
  sectionIndex: number;
  section: any;
  timestamp: string;
}

interface LessonStatePayload {
  lessonId: string;
  state: 'started' | 'paused' | 'resumed' | 'ended';
  timestamp: string;
  currentSection?: number;
}

interface StudentInteractionPayload {
  lessonId: string;
  studentId: string;
  type: string;
  data: any;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/lesson',
})
export class ClassroomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ClassroomGateway');

  // 存储活跃的课堂房间信息
  private activeRooms = new Map<string, Set<string>>();
  // 存储用户信息
  private userSockets = new Map<string, { userId: string; role: string; classroomId: string }>();

  constructor(
    @InjectRepository(ClassSession)
    private readonly classSessionRepository: Repository<ClassSession>,
    @InjectRepository(ClassMember)
    private readonly classMemberRepository: Repository<ClassMember>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // 可以在这里进行认证
    // const token = client.handshake.auth.token;
    // 验证token...
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // 清理用户信息
    const userInfo = this.userSockets.get(client.id);
    if (userInfo) {
      // 通知其他用户该用户已离开
      client.broadcast.emit('user_left', {
        userId: userInfo.userId,
        role: userInfo.role,
        classroomId: userInfo.classroomId,
      });

      // 从房间中移除
      this.removeFromRoom(userInfo.classroomId, client.id);
      this.userSockets.delete(client.id);
    }
  }

  @SubscribeMessage('join_lesson')
  async handleJoinLesson(
    @MessageBody() payload: JoinLessonPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { lessonId, userId, role, classroomId } = payload;

      // 验证用户是否有权限加入课堂
      const member = await this.classMemberRepository.findOne({
        where: {
          classroomId,
          userId,
        },
      });

      if (!member) {
        throw new WsException('用户不是该班级成员');
      }

      // 加入房间
      const roomName = `lesson_${lessonId}`;
      client.join(roomName);
      this.addToRoom(roomName, client.id);

      // 存储用户信息
      this.userSockets.set(client.id, { userId, role, classroomId });

      // 获取房间当前用户数
      const roomSize = this.activeRooms.get(roomName)?.size || 0;

      this.logger.log(`User ${userId} (${role}) joined lesson ${lessonId}`);

      // 通知房间内其他用户
      client.to(roomName).emit('user_joined', {
        userId,
        role,
        roomSize: roomSize + 1,
      });

      // 返回加入成功信息
      return {
        success: true,
        roomSize: roomSize + 1,
        message: '成功加入课堂',
      };
    } catch (error) {
      this.logger.error(`Failed to join lesson: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('leave_lesson')
  async handleLeaveLesson(
    @MessageBody() payload: { lessonId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { lessonId, userId } = payload;
      const roomName = `lesson_${lessonId}`;

      client.leave(roomName);
      this.removeFromRoom(roomName, client.id);

      const userInfo = this.userSockets.get(client.id);
      if (userInfo) {
        // 通知房间内其他用户
        client.to(roomName).emit('user_left', {
          userId,
          role: userInfo.role,
        });

        this.userSockets.delete(client.id);
      }

      this.logger.log(`User ${userId} left lesson ${lessonId}`);

      return { success: true, message: '成功离开课堂' };
    } catch (error) {
      this.logger.error(`Failed to leave lesson: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('section_change')
  async handleSectionChange(
    @MessageBody() payload: SectionChangePayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { lessonId, sectionIndex, section, timestamp } = payload;
      const roomName = `lesson_${lessonId}`;

      // 验证发送者是否是教师
      const userInfo = this.userSockets.get(client.id);
      if (!userInfo || userInfo.role !== 'teacher') {
        throw new WsException('只有教师可以切换环节');
      }

      // 记录环节切换事件
      await this.recordSessionEvent(lessonId, {
        type: 'section_change',
        data: { sectionIndex, section },
        timestamp: new Date(timestamp),
      });

      // 广播给房间内所有学生
      this.server.to(roomName).emit('section_changed', {
        sectionIndex,
        section,
        timestamp,
      });

      this.logger.log(`Section changed to ${sectionIndex} in lesson ${lessonId}`);

      return { success: true, message: '环节切换成功' };
    } catch (error) {
      this.logger.error(`Failed to change section: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('lesson_state_change')
  async handleLessonStateChange(
    @MessageBody() payload: LessonStatePayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { lessonId, state, timestamp, currentSection } = payload;
      const roomName = `lesson_${lessonId}`;

      // 验证发送者是否是教师
      const userInfo = this.userSockets.get(client.id);
      if (!userInfo || userInfo.role !== 'teacher') {
        throw new WsException('只有教师可以改变课堂状态');
      }

      // 记录状态变化事件
      await this.recordSessionEvent(lessonId, {
        type: 'lesson_state_change',
        data: { state, currentSection },
        timestamp: new Date(timestamp),
      });

      // 广播给房间内所有学生
      this.server.to(roomName).emit('lesson_state_changed', {
        state,
        timestamp,
        currentSection,
      });

      this.logger.log(`Lesson state changed to ${state} in lesson ${lessonId}`);

      return { success: true, message: '课堂状态更新成功' };
    } catch (error) {
      this.logger.error(`Failed to change lesson state: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('student_interaction')
  async handleStudentInteraction(
    @MessageBody() payload: StudentInteractionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { lessonId, studentId, type, data, timestamp } = payload;
      const roomName = `lesson_${lessonId}`;

      // 验证发送者是否是该学生
      const userInfo = this.userSockets.get(client.id);
      if (!userInfo || userInfo.userId !== studentId) {
        throw new WsException('只能提交自己的交互数据');
      }

      // 记录学生交互事件
      await this.recordSessionEvent(lessonId, {
        type: 'student_interaction',
        data: { studentId, interactionType: type, interactionData: data },
        timestamp: new Date(timestamp),
      });

      // 广播给房间内教师
      this.server.to(roomName).emit('student_interaction_received', {
        studentId,
        type,
        data,
        timestamp,
      });

      this.logger.log(`Student interaction received: ${type} from ${studentId}`);

      return { success: true, message: '交互数据提交成功' };
    } catch (error) {
      this.logger.error(`Failed to handle student interaction: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('annotation_added')
  async handleAnnotationAdded(
    @MessageBody() payload: {
      lessonId: string;
      annotation: any;
      timestamp: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { lessonId, annotation, timestamp } = payload;
      const roomName = `lesson_${lessonId}`;

      // 验证发送者是否是教师
      const userInfo = this.userSockets.get(client.id);
      if (!userInfo || userInfo.role !== 'teacher') {
        throw new WsException('只有教师可以添加批注');
      }

      // 记录批注事件
      await this.recordSessionEvent(lessonId, {
        type: 'annotation_added',
        data: { annotation },
        timestamp: new Date(timestamp),
      });

      // 广播给房间内所有学生
      this.server.to(roomName).emit('annotation_received', {
        annotation,
        timestamp,
      });

      this.logger.log(`Annotation added in lesson ${lessonId}`);

      return { success: true, message: '批注添加成功' };
    } catch (error) {
      this.logger.error(`Failed to add annotation: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  // 工具方法
  private addToRoom(roomName: string, socketId: string) {
    if (!this.activeRooms.has(roomName)) {
      this.activeRooms.set(roomName, new Set());
    }
    this.activeRooms.get(roomName)!.add(socketId);
  }

  private removeFromRoom(roomName: string, socketId: string) {
    const room = this.activeRooms.get(roomName);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.activeRooms.delete(roomName);
      }
    }
  }

  private async recordSessionEvent(lessonId: string, event: {
    type: string;
    data: any;
    timestamp: Date;
  }) {
    try {
      // 这里可以将事件保存到数据库
      // 暂时只记录日志
      this.logger.log(`Session event recorded for lesson ${lessonId}: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to record session event: ${error.message}`);
    }
  }

  // 获取房间状态（用于监控）
  getRoomStatus() {
    const status = {};
    for (const [roomName, sockets] of this.activeRooms.entries()) {
      status[roomName] = {
        userCount: sockets.size,
        users: Array.from(sockets).map(socketId => this.userSockets.get(socketId)),
      };
    }
    return status;
  }
}