import { LoggerService, Provider } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

import { OpenAgentLogger as LoggerProvide } from '../../../base/logger';
import { OpenAgentLogger } from './logger';

const moreMetadata = format(info => {
  info.requestId = LoggerProvide.getRequestId();
  return info;
});

export const LoggerProvider: Provider<LoggerService> = {
  provide: LoggerProvide,
  useFactory: () => {
    const instance = createLogger({
      level: env.namespaces.canary ? 'debug' : 'info',
      transports: [new transports.Console()],
      format: format.combine(moreMetadata(), format.json()),
    });
    return new OpenAgentLogger(instance);
  },
};
