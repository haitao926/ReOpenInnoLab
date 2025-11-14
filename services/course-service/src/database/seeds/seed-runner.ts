import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../app.module'
import { DataSource } from 'typeorm'
import { SeedData } from './seed-data'

async function runSeed() {
  console.log('🚀 启动种子数据执行器...')

  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  try {
    const seedData = new SeedData(dataSource)
    await seedData.run()
    console.log('🎉 种子数据执行成功!')
  } catch (error) {
    console.error('💥 种子数据执行失败:', error)
    process.exit(1)
  } finally {
    await app.close()
  }

  process.exit(0)
}

runSeed().catch(error => {
  console.error('💥 种子数据执行器启动失败:', error)
  process.exit(1)
})