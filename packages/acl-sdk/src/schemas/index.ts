/**
 * ACL JSON Schema 定义
 * 基于 AJV 的验证架构
 */

export const aclSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://reopeninnolab.org/schemas/acl-v1.0.0.json',
  title: 'AiCourseLayout',
  description: 'AI智能课件结构定义文件格式',
  type: 'object',
  required: ['meta', 'courseInfo', 'structure', 'resourceRefs'],
  additionalProperties: false,
  properties: {
    meta: {
      $ref: '#/$defs/CourseMeta'
    },
    courseInfo: {
      $ref: '#/$defs/CourseInfo'
    },
    structure: {
      $ref: '#/$defs/CourseStructure'
    },
    resourceRefs: {
      type: 'array',
      items: {
        $ref: '#/$defs/ResourceReference'
      }
    },
    analyticsProfile: {
      $ref: '#/$defs/AnalyticsProfile'
    }
  },
  $defs: {
    CourseMeta: {
      type: 'object',
      required: ['id', 'version', 'tags', 'contributors', 'lastModified'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$',
          description: '课程唯一标识符'
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$',
          description: '语义化版本号'
        },
        tenant: {
          type: 'string',
          description: '租户标识'
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 1,
            maxLength: 50
          },
          uniqueItems: true,
          maxItems: 20
        },
        contributors: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email'
          },
          uniqueItems: true,
          minItems: 1
        },
        license: {
          type: 'string',
          enum: ['MIT', 'Apache-2.0', 'CC-BY-4.0', 'CC-BY-NC-4.0', 'Proprietary']
        },
        lastModified: {
          type: 'string',
          format: 'date-time'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        }
      }
    },

    CourseInfo: {
      type: 'object',
      required: ['title', 'subject', 'grade', 'learningObjectives', 'targetAudience', 'estimatedDuration', 'aiPrompts'],
      additionalProperties: false,
      properties: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          description: '课程标题'
        },
        description: {
          type: 'string',
          maxLength: 1000,
          description: '课程描述'
        },
        subject: {
          type: 'string',
          enum: ['math', 'physics', 'chemistry', 'biology', 'language', 'history', 'geography', 'english', 'art', 'music', 'pe', 'it'],
          description: '学科领域'
        },
        grade: {
          type: 'string',
          pattern: '^[1-9]|10|11|12$',
          description: '年级'
        },
        learningObjectives: {
          type: 'array',
          items: {
            $ref: '#/$defs/LearningObjective'
          },
          minItems: 1,
          maxItems: 20
        },
        targetAudience: {
          $ref: '#/$defs/TargetAudience'
        },
        estimatedDuration: {
          type: 'integer',
          minimum: 1,
          maximum: 10000,
          description: '预计时长（分钟）'
        },
        prerequisites: {
          type: 'array',
          items: {
            type: 'string'
          },
          maxItems: 10
        },
        aiPrompts: {
          $ref: '#/$defs/AIPrompts'
        }
      }
    },

    LearningObjective: {
      type: 'object',
      required: ['id', 'description', 'cognitiveLevel', 'assessmentCriteria'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$'
        },
        description: {
          type: 'string',
          minLength: 10,
          maxLength: 500
        },
        cognitiveLevel: {
          type: 'string',
          enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
        },
        assessmentCriteria: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 5
          },
          minItems: 1
        },
        prerequisites: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },

    TargetAudience: {
      type: 'object',
      required: ['grade', 'learningStyles'],
      additionalProperties: false,
      properties: {
        grade: {
          type: 'string',
          pattern: '^[1-9]|10|11|12$'
        },
        classSize: {
          type: 'string',
          enum: ['small', 'medium', 'large']
        },
        priorKnowledge: {
          type: 'string',
          maxLength: 500
        },
        learningStyles: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['visual', 'auditory', 'kinesthetic', 'reading']
          },
          uniqueItems: true,
          minItems: 1
        },
        specialNeeds: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },

    AIPrompts: {
      type: 'object',
      required: ['generation', 'assessment'],
      additionalProperties: false,
      properties: {
        generation: {
          type: 'string',
          minLength: 10,
          maxLength: 2000
        },
        assessment: {
          type: 'string',
          minLength: 10,
          maxLength: 2000
        },
        intervention: {
          type: 'string',
          maxLength: 2000
        }
      }
    },

    CourseStructure: {
      type: 'array',
      items: {
        $ref: '#/$defs/CourseNode'
      }
    },

    CourseNode: {
      type: 'object',
      required: ['id', 'title', 'type', 'duration', 'learningGoals', 'resourceRefs'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_-]+$'
        },
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 200
        },
        type: {
          type: 'string',
          enum: ['introduction', 'chapter', 'knowledge', 'activity', 'experiment', 'interaction', 'assignment', 'assessment']
        },
        duration: {
          type: 'integer',
          minimum: 1,
          maximum: 1000
        },
        learningGoals: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 5
          },
          minItems: 1,
          maxItems: 10
        },
        aiStrategy: {
          $ref: '#/$defs/AIStrategy'
        },
        assessment: {
          $ref: '#/$defs/Assessment'
        },
        resourceRefs: {
          type: 'array',
          items: {
            type: 'string'
          },
          uniqueItems: true
        },
        metadata: {
          type: 'object',
          additionalProperties: true
        }
      },
      allOf: [
        {
          if: {
            properties: {
              type: { const: 'introduction' }
            }
          },
          then: {
            properties: {
              content: {
                $ref: '#/$defs/IntroductionContent'
              }
            },
            required: ['content']
          }
        },
        {
          if: {
            properties: {
              type: { const: 'chapter' }
            }
          },
          then: {
            properties: {
              children: {
                type: 'array',
                items: {
                  $ref: '#/$defs/CourseNode'
                }
              }
            },
            required: ['children']
          }
        },
        {
          if: {
            properties: {
              type: { const: 'knowledge' }
            }
          },
          then: {
            properties: {
              content: {
                $ref: '#/$defs/KnowledgeContent'
              }
            },
            required: ['content']
          }
        },
        {
          if: {
            properties: {
              type: { const: 'activity' }
            }
          },
          then: {
            properties: {
              content: {
                $ref: '#/$defs/ActivityContent'
              }
            },
            required: ['content']
          }
        },
        {
          if: {
            properties: {
              type: { const: 'experiment' }
            }
          },
          then: {
            properties: {
              content: {
                $ref: '#/$defs/ExperimentContent'
              }
            },
            required: ['content']
          }
        },
        {
          if: {
            properties: {
              type: { const: 'interaction' }
            }
          },
          then: {
            properties: {
              content: {
                $ref: '#/$defs/InteractionContent'
              }
            },
            required: ['content']
          }
        },
        {
          if: {
            properties: {
              type: { const: 'assignment' }
            }
          },
          then: {
            properties: {
              content: {
                $ref: '#/$defs/AssignmentContent'
              }
            },
            required: ['content']
          }
        },
        {
          if: {
            properties: {
              type: { const: 'assessment' }
            }
          },
          then: {
            properties: {
              content: {
                $ref: '#/$defs/AssessmentContent'
              }
            },
            required: ['content']
          }
        }
      ]
    },

    AIStrategy: {
      type: 'object',
      required: ['type'],
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          minLength: 1
        },
        dataSources: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        fallbackContent: {
          type: 'string'
        },
        adaptationRules: {
          type: 'object',
          additionalProperties: true
        }
      }
    },

    Assessment: {
      type: 'object',
      required: ['type', 'indicators'],
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          enum: ['formative', 'summative', 'diagnostic']
        },
        indicators: {
          type: 'array',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        aiAnalysis: {
          type: 'string'
        },
        interventionThreshold: {
          type: 'object',
          additionalProperties: {
            type: 'string'
          }
        }
      }
    },

    IntroductionContent: {
      type: 'object',
      required: ['hookType', 'hookContent', 'objectives'],
      additionalProperties: false,
      properties: {
        hookType: {
          type: 'string',
          enum: ['question', 'story', 'video', 'image']
        },
        hookContent: {
          type: 'string',
          minLength: 1
        },
        objectives: {
          type: 'array',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        prerequisites: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },

    KnowledgeContent: {
      type: 'object',
      required: ['format', 'content'],
      additionalProperties: false,
      properties: {
        format: {
          type: 'string',
          enum: ['text', 'video', 'audio', 'interactive']
        },
        content: {
          oneOf: [
            { type: 'string' },
            { $ref: '#/$defs/MediaContent' }
          ]
        },
        examples: {
          type: 'array',
          items: {
            $ref: '#/$defs/Example'
          }
        },
        checkpoints: {
          type: 'array',
          items: {
            $ref: '#/$defs/Checkpoint'
          }
        }
      }
    },

    MediaContent: {
      type: 'object',
      required: ['type', 'url', 'format'],
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          enum: ['video', 'audio', 'image', 'document']
        },
        url: {
          type: 'string',
          format: 'uri'
        },
        duration: {
          type: 'integer',
          minimum: 1
        },
        size: {
          type: 'integer',
          minimum: 1
        },
        format: {
          type: 'string'
        }
      }
    },

    Example: {
      type: 'object',
      required: ['id', 'title', 'content', 'difficulty'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string'
        },
        title: {
          type: 'string',
          minLength: 1
        },
        content: {
          type: 'string',
          minLength: 1
        },
        explanation: {
          type: 'string'
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard']
        }
      }
    },

    Checkpoint: {
      type: 'object',
      required: ['id', 'question', 'type', 'correctAnswer'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string'
        },
        question: {
          type: 'string',
          minLength: 1
        },
        type: {
          type: 'string',
          enum: ['multiple-choice', 'true-false', 'short-answer']
        },
        options: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        correctAnswer: {
          oneOf: [
            { type: 'string' },
            { type: 'integer' }
          ]
        },
        explanation: {
          type: 'string'
        }
      }
    },

    ActivityContent: {
      type: 'object',
      required: ['activityType', 'instructions', 'duration', 'collaborationLevel'],
      additionalProperties: false,
      properties: {
        activityType: {
          type: 'string',
          enum: ['individual', 'group', 'class']
        },
        instructions: {
          type: 'string',
          minLength: 10
        },
        duration: {
          type: 'integer',
          minimum: 1
        },
        materials: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        collaborationLevel: {
          type: 'string',
          enum: ['low', 'medium', 'high']
        }
      }
    },

    ExperimentContent: {
      type: 'object',
      required: ['experimentType', 'safetyLevel'],
      additionalProperties: false,
      properties: {
        experimentType: {
          type: 'string',
          enum: ['jupyter', 'virtual', 'physical', 'simulation']
        },
        notebook: {
          type: 'string'
        },
        environment: {
          $ref: '#/$defs/ExperimentEnvironment'
        },
        aiAssistant: {
          $ref: '#/$defs/AIExperimentAssistant'
        },
        safetyLevel: {
          type: 'string',
          enum: ['safe', 'moderate', 'high']
        }
      }
    },

    ExperimentEnvironment: {
      type: 'object',
      required: ['type'],
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          enum: ['jupyter', 'docker', 'web']
        },
        image: {
          type: 'string'
        },
        resources: {
          $ref: '#/$defs/ResourceAllocation'
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },

    ResourceAllocation: {
      type: 'object',
      required: ['cpu', 'memory'],
      additionalProperties: false,
      properties: {
        cpu: {
          type: 'string',
          pattern: '^\\d+[m]?$'
        },
        memory: {
          type: 'string',
          pattern: '^\\d+[MG]i?$'
        },
        storage: {
          type: 'string',
          pattern: '^\\d+[MG]i?$'
        },
        gpu: {
          type: 'boolean'
        }
      }
    },

    AIExperimentAssistant: {
      type: 'object',
      required: ['capabilities', 'interactionStyle', 'adaptationLevel'],
      additionalProperties: false,
      properties: {
        capabilities: {
          type: 'array',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        interactionStyle: {
          type: 'string',
          enum: ['socratic', 'direct', 'guided']
        },
        adaptationLevel: {
          type: 'string',
          minLength: 1
        },
        personality: {
          type: 'string'
        }
      }
    },

    InteractionContent: {
      type: 'object',
      required: ['interactionType', 'content'],
      additionalProperties: false,
      properties: {
        interactionType: {
          type: 'string',
          enum: ['html', 'simulation', 'game', 'vr']
        },
        content: {
          type: 'string',
          minLength: 1
        },
        previewConfig: {
          $ref: '#/$defs/PreviewConfig'
        },
        tracking: {
          $ref: '#/$defs/TrackingConfig'
        }
      }
    },

    PreviewConfig: {
      type: 'object',
      required: ['device', 'orientation', 'interactive'],
      additionalProperties: false,
      properties: {
        device: {
          type: 'string',
          enum: ['desktop', 'tablet', 'mobile']
        },
        orientation: {
          type: 'string',
          enum: ['portrait', 'landscape']
        },
        interactive: {
          type: 'boolean'
        }
      }
    },

    TrackingConfig: {
      type: 'object',
      required: ['events', 'analytics', 'privacy'],
      additionalProperties: false,
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        analytics: {
          type: 'boolean'
        },
        privacy: {
          type: 'string',
          enum: ['strict', 'standard', 'minimal']
        }
      }
    },

    AssignmentContent: {
      type: 'object',
      required: ['assignmentType', 'submissionFormat'],
      additionalProperties: false,
      properties: {
        assignmentType: {
          type: 'string',
          enum: ['quiz', 'essay', 'project', 'presentation']
        },
        questions: {
          type: 'array',
          items: {
            $ref: '#/$defs/Question'
          }
        },
        rubric: {
          $ref: '#/$defs/Rubric'
        },
        submissionFormat: {
          type: 'array',
          items: {
            type: 'string'
          },
          minItems: 1
        }
      }
    },

    AssessmentContent: {
      type: 'object',
      required: ['assessmentType', 'questions'],
      additionalProperties: false,
      properties: {
        assessmentType: {
          type: 'string',
          enum: ['quiz', 'test', 'portfolio', 'performance']
        },
        questions: {
          type: 'array',
          items: {
            $ref: '#/$defs/Question'
          },
          minItems: 1
        },
        timeLimit: {
          type: 'integer',
          minimum: 1
        },
        passingScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        }
      }
    },

    Question: {
      type: 'object',
      required: ['id', 'type', 'question', 'correctAnswer', 'points'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string'
        },
        type: {
          type: 'string',
          enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank', 'matching', 'ordering']
        },
        question: {
          type: 'string',
          minLength: 1
        },
        options: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        correctAnswer: {
          oneOf: [
            { type: 'string' },
            { type: 'integer' },
            { type: 'boolean' }
          ]
        },
        points: {
          type: 'integer',
          minimum: 1
        },
        explanation: {
          type: 'string'
        },
        metadata: {
          type: 'object',
          additionalProperties: true
        }
      }
    },

    Rubric: {
      type: 'object',
      required: ['criteria', 'maxScore', 'levels'],
      additionalProperties: false,
      properties: {
        criteria: {
          type: 'array',
          items: {
            $ref: '#/$defs/RubricCriteria'
          },
          minItems: 1
        },
        maxScore: {
          type: 'integer',
          minimum: 1
        },
        levels: {
          type: 'array',
          items: {
            $ref: '#/$defs/RubricLevel'
          },
          minItems: 2
        }
      }
    },

    RubricCriteria: {
      type: 'object',
      required: ['id', 'description', 'weight', 'levels'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string'
        },
        description: {
          type: 'string',
          minLength: 1
        },
        weight: {
          type: 'number',
          minimum: 0,
          maximum: 1
        },
        levels: {
          type: 'array',
          items: {
            $ref: '#/$defs/RubricLevel'
          },
          minItems: 1
        }
      }
    },

    RubricLevel: {
      type: 'object',
      required: ['name', 'description', 'points'],
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1
        },
        description: {
          type: 'string',
          minLength: 1
        },
        points: {
          type: 'integer',
          minimum: 0
        }
      }
    },

    ResourceReference: {
      type: 'object',
      required: ['id', 'type', 'title', 'url'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string'
        },
        type: {
          type: 'string',
          enum: ['video', 'image', 'document', 'audio', 'simulation', 'notebook', 'tool', 'external']
        },
        title: {
          type: 'string',
          minLength: 1
        },
        description: {
          type: 'string'
        },
        url: {
          type: 'string',
          format: 'uri'
        },
        metadata: {
          type: 'object',
          additionalProperties: true
        }
      }
    },

    AnalyticsProfile: {
      type: 'object',
      required: ['learningMetrics', 'aiInsights'],
      additionalProperties: false,
      properties: {
        learningMetrics: {
          type: 'array',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        aiInsights: {
          $ref: '#/$defs/AIInsights'
        }
      }
    },

    AIInsights: {
      type: 'object',
      required: ['learningPathOptimization', 'difficultyAdjustment', 'recommendationEngine'],
      additionalProperties: false,
      properties: {
        learningPathOptimization: {
          type: 'boolean'
        },
        difficultyAdjustment: {
          type: 'boolean'
        },
        recommendationEngine: {
          type: 'boolean'
        }
      }
    }
  }
}

export default aclSchema