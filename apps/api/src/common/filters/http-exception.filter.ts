import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {

  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Errore interno del server'
    let error: string = 'Internal Server Error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
        error = exception.name
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, unknown>
        message = (res.message as string | string[]) || exception.message
        error = (res.error as string) || exception.name
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Errore non gestito: ${exception.message}`,
        exception.stack,
      )
    } else {
      this.logger.error('Eccezione sconosciuta', JSON.stringify(exception))
    }

    if (status >= 400 && status < 500) {
      this.logger.warn(
        `${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}`,
      )
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    })
  }
}
