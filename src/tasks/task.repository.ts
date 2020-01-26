import { Repository, EntityRepository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../authentication/user.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger('TaskRepository');

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.createQueryBuilder('task');

    // userId needs to be defined in tasks entity
    query.where('task.userId = :userId', { userId: user.id });

    if (status) {
      // .andWhere() adds the filters to queries, .where() overrides them.
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      // Like is more flexible, e.g will forgive if a term has a whitespace
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` }
      );
      // %% allows us to search for terms that include the provided field. if we search for nest, it will return nest.js
    }

    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for user "${user.username}". DTO: ${JSON.stringify(
          filterDto
        )}`,
        error.stack
      );
      throw new InternalServerErrorException();
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = new Task();
    task.title = title;
    task.description = description;
    task.status = TaskStatus.OPEN;
    task.user = user;
    try {
      await task.save();
    } catch (error) {
      this.logger.error(
        `Failed to create task for user "${
          user.username
        }". DTO: ${JSON.stringify(createTaskDto)}`,
        error.stack
      );
      throw new InternalServerErrorException();
    }

    delete task.user;
    return task;
  }
}
