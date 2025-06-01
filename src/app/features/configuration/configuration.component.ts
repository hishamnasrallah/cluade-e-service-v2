// src/app/features/configuration/configuration.component.ts
import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  imports: [
    ReactiveFormsModule
  ],
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  configForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private router: Router
  ) {
    this.configForm = this.fb.group({
      baseUrl: ['', [Validators.required, Validators.pattern('https?://.+')]]
    });
  }

  ngOnInit(): void {
    const currentUrl = this.configService.getBaseUrl();
    if (currentUrl) {
      this.configForm.patchValue({ baseUrl: currentUrl });
    }
  }

  onSubmit(): void {
    if (this.configForm.valid) {
      const url = this.configForm.value.baseUrl;
      this.configService.setBaseUrl(url);
      this.router.navigate(['/login']);
    }
  }
}
