import { Request, Response } from "express";
import { ValidationError, validationResult, FieldValidationError } from "express-validator";

interface FormattedError {
  field: string;
  message: string;
}

function formatSingleError(error: ValidationError): FormattedError {
  const field = error.type === "field"
    ? (error as FieldValidationError).path
    : "";
  return { field, message: error.msg };
}

export function formatValidationErrors(
  errors: ValidationError[]
): FormattedError[] {
  return errors.map(formatSingleError);
}

export function handleValidationErrors(
  req: Request,
  res: Response
): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: formatValidationErrors(errors.array()),
    });
    return true;
  }
  return false;
}
