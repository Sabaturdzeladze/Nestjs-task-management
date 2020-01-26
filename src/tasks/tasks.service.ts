import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { User } from '../authentication/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskRepository)
    private taskRepository: TaskRepository
  ) {}

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    return this.taskRepository.getTasks(filterDto, user);
  }

  async getTaskById(id: number, user: User): Promise<Task> {
    const found = await this.taskRepository.findOne({
      where: { id, userId: user.id }
    });

    if (!found) {
      throw new NotFoundException(`Task with ID: ${id} not found`);
    }
    return found;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return this.taskRepository.createTask(createTaskDto, user);
  }

  async deleteTask(id: number, user: User): Promise<void> {
    const result = await this.taskRepository.delete({ id, userId: user.id });
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async updateTaskStatus(
    id: number,
    status: TaskStatus,
    user: User
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;
    await task.save();
    return task;
  }

  // editTaskStatus(id: string, status: TaskStatus): Task {
  //   // getTaskById throws exception if task is not found
  //   const task = this.getTaskById(id);
  //   task.status = status;
  //   return task;
  // }
  // deleteTask(id: string): void {
  //   // getTaskById throws exception if task is not found
  //   const found = this.getTaskById(id);
  //   this.tasks = this.tasks.filter(task => task.id !== found.id);
  // }
}
