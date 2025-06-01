// src/app/models/interfaces.ts
// This is an alias file to maintain backward compatibility
// All interfaces are re-exported from the core models
export * from '../core/models/interfaces';

// Additional exports for specific components that might need them
export type { Service, ServicesResponse } from '../core/models/interfaces';
export type { ServiceFlowStep, ServiceFlowResponse } from '../core/models/interfaces';
export type { Application, ApplicationsResponse, ApplicationStatus } from '../core/models/interfaces';
