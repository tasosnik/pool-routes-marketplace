import Joi from 'joi';
import { UserRole, ServiceType, ServiceFrequency, PoolType, PoolSize } from '../types';

// User validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().allow('').messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  company: Joi.string().max(100).optional().allow(''),
  role: Joi.string().valid(...Object.values(UserRole)).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().allow(''),
  company: Joi.string().max(100).optional().allow('')
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'New password must be at least 8 characters long',
    'any.required': 'New password is required'
  }),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'New passwords do not match',
    'any.required': 'Please confirm your new password'
  })
});

// Address validation schema
const addressSchema = Joi.object({
  street: Joi.string().required().messages({
    'any.required': 'Street address is required'
  }),
  city: Joi.string().required().messages({
    'any.required': 'City is required'
  }),
  state: Joi.string().length(2).required().messages({
    'string.length': 'State must be 2 characters (e.g., CA)',
    'any.required': 'State is required'
  }),
  zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required().messages({
    'string.pattern.base': 'ZIP code must be in format 12345 or 12345-6789',
    'any.required': 'ZIP code is required'
  }),
  country: Joi.string().optional().default('USA'),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).optional()
});

// Route validation schemas
export const createRouteSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Route name must be at least 2 characters long',
    'string.max': 'Route name cannot exceed 100 characters',
    'any.required': 'Route name is required'
  }),
  description: Joi.string().max(500).optional(),
  serviceArea: Joi.object({
    name: Joi.string().required(),
    centerPoint: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required(),
    radius: Joi.number().min(0.1).max(100).optional(),
    boundaries: Joi.array().items(
      Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required()
      })
    ).min(3).optional()
  }).required()
});

export const updateRouteSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  serviceArea: Joi.object({
    name: Joi.string().required(),
    centerPoint: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required(),
    radius: Joi.number().min(0.1).max(100).optional(),
    boundaries: Joi.array().items(
      Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required()
      })
    ).min(3).optional()
  }).optional()
});

// Pool account validation schemas
export const createAccountSchema = Joi.object({
  customerName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Customer name must be at least 2 characters long',
    'string.max': 'Customer name cannot exceed 100 characters',
    'any.required': 'Customer name is required'
  }),
  customerEmail: Joi.string().email().optional().allow('').messages({
    'string.email': 'Please provide a valid email address'
  }),
  customerPhone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().allow('').messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  address: addressSchema.required(),
  serviceType: Joi.string().valid(...Object.values(ServiceType)).required(),
  frequency: Joi.string().valid(...Object.values(ServiceFrequency)).required(),
  monthlyRate: Joi.number().min(0).max(10000).required().messages({
    'number.min': 'Monthly rate cannot be negative',
    'number.max': 'Monthly rate cannot exceed $10,000',
    'any.required': 'Monthly rate is required'
  }),
  poolType: Joi.string().valid(...Object.values(PoolType)).optional(),
  poolSize: Joi.string().valid(...Object.values(PoolSize)).optional(),
  equipmentNotes: Joi.string().max(500).optional().allow(''),
  accessInstructions: Joi.string().max(500).optional().allow(''),
  specialRequirements: Joi.string().max(500).optional().allow(''),
  startDate: Joi.date().iso().optional().default(() => new Date())
});

export const updateAccountSchema = createAccountSchema.fork([
  'customerName',
  'address',
  'serviceType',
  'frequency',
  'monthlyRate'
], (schema) => schema.optional());

// File upload validation
export const fileUploadSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  mimetype: Joi.string().valid(
    'text/csv',
    'application/csv',
    'text/plain',
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ).required().messages({
    'any.only': 'File type must be CSV, PDF, or image (JPEG, PNG, WebP)'
  }),
  size: Joi.number().max(10 * 1024 * 1024).required().messages({
    'number.max': 'File size cannot exceed 10MB'
  })
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};