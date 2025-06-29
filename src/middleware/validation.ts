import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createErrorResponse } from '../utils/errorHandler';
import { ErrorCode } from '../types/errorCodes';

export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join('; ');
      res.status(400).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, errorMessage));
      return;
    }

    req.body = value;
    next();
  };
};