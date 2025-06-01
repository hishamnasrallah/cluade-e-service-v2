// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// import { AppRoutingModule } from './app-routes';
import { AppComponent } from './app.component';

// Core
import { ApiInterceptor } from './core/interceptors/api.interceptor';

// Features
import { ConfigurationComponent } from './features/configuration/configuration.component';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { ServicesListComponent } from './features/services/services-list/services-list.component';
import { ServiceWizardComponent } from './features/services/service-wizard/service-wizard.component';
import { DynamicFormComponent } from './features/services/dynamic-form/dynamic-form.component';
import { ApplicationsListComponent } from './features/applications/applications-list/applications-list.component';
import { ApplicationDetailComponent } from './features/applications/application-detail/application-detail.component';

// Field Components
import { TextFieldComponent } from './features/services/dynamic-form/field-components/text-field/text-field.component';
import { NumberFieldComponent } from './features/services/dynamic-form/field-components/number-field/number-field.component';
import { BooleanFieldComponent } from './features/services/dynamic-form/field-components/boolean-field/boolean-field.component';
import { ChoiceFieldComponent } from './features/services/dynamic-form/field-components/choice-field/choice-field.component';
import { FileFieldComponent } from './features/services/dynamic-form/field-components/file-field/file-field.component';
import { DecimalFieldComponent } from './features/services/dynamic-form/field-components/decimal-field/decimal-field.component';
import { PercentageFieldComponent } from './features/services/dynamic-form/field-components/percentage-field/percentage-field.component';

// Shared
import { LoadingComponent } from './features/shared/components/loading/loading.component';
import { ErrorMessageComponent } from './features/shared/components/error-message/error-message.component';
import { SafeHtmlPipe } from './features/shared/pipes/safe-html.pipe';
import {AppRoutingModule} from './app.routes';

@NgModule({
  declarations: [

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ServicesListComponent,
    AppComponent,
    ConfigurationComponent,
    LoginComponent,
    HomeComponent,
    ServiceWizardComponent,
    DynamicFormComponent,
    ApplicationsListComponent,
    ApplicationDetailComponent,
    TextFieldComponent,
    NumberFieldComponent,
    BooleanFieldComponent,
    ChoiceFieldComponent,
    FileFieldComponent,
    DecimalFieldComponent,
    PercentageFieldComponent,
    LoadingComponent,
    ErrorMessageComponent,
    SafeHtmlPipe
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
