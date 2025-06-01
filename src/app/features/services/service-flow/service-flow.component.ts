// src/app/features/services/service-flow/service-flow.component.ts
import { Component } from '@angular/core';
import { ServiceWizardComponent } from '../service-wizard/service-wizard.component';

@Component({
  selector: 'app-service-flow',
  standalone: true,
  imports: [ServiceWizardComponent],
  template: '<app-service-wizard></app-service-wizard>'
})
export class ServiceFlowComponent extends ServiceWizardComponent {
  // This component extends ServiceWizardComponent to maintain compatibility
  // All logic is inherited from ServiceWizardComponent
}
