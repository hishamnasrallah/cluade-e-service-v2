// src/app/features/services/service-wizard/service-wizard.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ServiceFlowService } from '../../../core/services/service-flow.service';
import { CaseService } from '../../../core/services/case.service';
import { ServiceFlowStep } from '../../../core/models/service-flow.model';
import {LoadingComponent} from '../../shared/components/loading/loading.component';
import {ErrorMessageComponent} from '../../shared/components/error-message/error-message.component';
import {SafeHtmlPipe} from '../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-service-wizard',
  templateUrl: './service-wizard.component.html',
  imports: [
    LoadingComponent,
    ErrorMessageComponent,
    SafeHtmlPipe
  ],
  styleUrls: ['./service-wizard.component.scss']
})
export class ServiceWizardComponent implements OnInit {
  serviceId: string = '';
  steps: ServiceFlowStep[] = [];
  currentStepIndex = 0;
  wizardForm: FormGroup;
  loading = false;
  error = '';
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private serviceFlowService: ServiceFlowService,
    private caseService: CaseService
  ) {
    this.wizardForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id') || '';
    this.loadServiceFlow();
  }

  loadServiceFlow(): void {
    this.loading = true;
    this.error = '';

    this.serviceFlowService.getServiceFlow(this.serviceId).subscribe({
      next: (response) => {
        this.steps = response.service_flow
          .filter(step => !step.is_hidden_page)
          .sort((a, b) => parseInt(a.sequence_number) - parseInt(b.sequence_number));
        this.loading = false;
        this.initializeForm();
      },
      error: (error) => {
        this.error = 'Failed to load service flow';
        this.loading = false;
        console.error('Service flow loading error:', error);
      }
    });
  }

  initializeForm(): void {
    const formData: any = {};
    this.steps.forEach(step => {
      step.categories.forEach(category => {
        category.fields.forEach(field => {
          formData[field.name] = [''];
        });
      });
    });
    this.wizardForm = this.fb.group(formData);
  }

  get currentStep(): ServiceFlowStep | null {
    return this.steps[this.currentStepIndex] || null;
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  nextStep(): void {
    if (!this.isLastStep) {
      this.currentStepIndex++;
    }
  }

  previousStep(): void {
    if (!this.isFirstStep) {
      this.currentStepIndex--;
    }
  }

  onFormDataChange(data: any): void {
    this.wizardForm.patchValue(data);
  }

  submit(): void {
    this.submitting = true;

    const formData = new FormData();
    const formValues = this.wizardForm.value;
    const fileFields: any[] = [];
    const caseData: any = {};

    // Separate files from other data
    Object.keys(formValues).forEach(key => {
      if (formValues[key] instanceof File) {
        fileFields.push({ key, file: formValues[key] });
      } else if (formValues[key] !== null && formValues[key] !== '') {
        caseData[key] = formValues[key];
      }
    });

    // Add case data
    formData.append('applicant_type', '13');
    formData.append('case_type', '9');
    formData.append('case_data', JSON.stringify(caseData));

    // Add files
    fileFields.forEach((fileField, index) => {
      formData.append(`files[${index}]`, fileField.file);
      formData.append(`file_types[${index}]`, '01'); // Default file type
    });

    this.caseService.createCase(formData).subscribe({
      next: (createdCase) => {
        // Submit the case
        this.caseService.submitCase(createdCase.id).subscribe({
          next: () => {
            this.submitting = false;
            alert('Application submitted successfully!');
            this.router.navigate(['/home']);
          },
          error: (error) => {
            this.submitting = false;
            console.error('Submit error:', error);
            alert('Case created but submission failed');
          }
        });
      },
      error: (error) => {
        this.submitting = false;
        console.error('Create case error:', error);
        alert('Failed to create application');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/home']);
  }
}
