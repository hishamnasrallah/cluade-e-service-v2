import { Injectable } from '@angular/core';
import { ServiceFlowField, FieldCalculation, CalculationRule } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FieldCalculationService {

  constructor() {}

  /**
   * Calculate all calculated fields in the given categories
   */
  calculateAllFields(
    categories: any[],
    formData: { [key: string]: any }
  ): { [key: string]: any } {
    console.log('🧮 FieldCalculation: Starting calculation for all fields');
    console.log('📊 FieldCalculation: Current form data:', formData);

    const calculatedValues: { [key: string]: any } = {};

    // Find all fields with calculations (regardless of field type)
    const calculatedFields: ServiceFlowField[] = [];
    let totalFieldsChecked = 0;

    categories.forEach((category, catIndex) => {
      console.log(`🔍 FieldCalculation: Checking category ${catIndex}:`, category.name || 'Unnamed');

      category.fields.forEach((field: ServiceFlowField) => {
        totalFieldsChecked++;
        console.log(`  📄 Field "${field.name}": type="${field.field_type}", has calculations=${!!field.calculations}`);

        // Check if field has calculations defined (regardless of field type)
        if (field.calculations && field.calculations.length > 0) {
          console.log(`  ✅ Found field with calculations: "${field.name}" (type: ${field.field_type})`);
          console.log(`    📊 Has ${field.calculations.length} calculation(s)`);
          calculatedFields.push(field);
        }
      });
    });

    console.log(`📊 FieldCalculation: Checked ${totalFieldsChecked} total fields`);

    console.log(`📋 FieldCalculation: Found ${calculatedFields.length} calculated fields:`,
      calculatedFields.map(f => ({ name: f.name, calculations: f.calculations })));

    // Calculate values for each calculated field
    calculatedFields.forEach(field => {
      console.log(`\n🔄 FieldCalculation: Processing field "${field.name}"`);
      const value = this.calculateFieldValue(field, formData);
      if (value !== undefined) {
        calculatedValues[field.name] = value;
        console.log(`✅ FieldCalculation: Result for "${field.name}" = ${value}`);
      } else {
        console.log(`❌ FieldCalculation: No value calculated for "${field.name}"`);
      }
    });

    console.log('\n📊 FieldCalculation: Final calculated values:', calculatedValues);
    return calculatedValues;
  }

  /**
   * Calculate value for a single field
   */
  calculateFieldValue(
    field: ServiceFlowField,
    formData: { [key: string]: any }
  ): any {
    console.log(`🎯 FieldCalculation: Calculating value for field "${field.name}"`);

    if (!field.calculations || field.calculations.length === 0) {
      console.log(`⚠️ FieldCalculation: No calculations defined for field "${field.name}"`);
      return undefined;
    }

    console.log(`📋 FieldCalculation: Field "${field.name}" has ${field.calculations.length} calculation(s)`);

    // Process each calculation (usually there's only one)
    for (let i = 0; i < field.calculations.length; i++) {
      const calculation = field.calculations[i];
      console.log(`🔍 FieldCalculation: Evaluating calculation ${i + 1}:`, calculation);

      const result = this.evaluateCalculation(calculation, formData);
      if (result !== undefined) {
        console.log(`✅ FieldCalculation: Field "${field.name}" = ${result} (from calculation ${i + 1})`);
        return result;
      }
    }

    console.log(`❌ FieldCalculation: No valid result for field "${field.name}"`);
    return undefined;
  }

  /**
   * Evaluate a single calculation
   */
  private evaluateCalculation(
    calculation: FieldCalculation,
    formData: { [key: string]: any }
  ): any {
    console.log('🔧 FieldCalculation: Evaluating calculation:', calculation);

    if (!calculation.condition_logic || calculation.condition_logic.length === 0) {
      console.log('⚠️ FieldCalculation: No condition logic in calculation');
      return undefined;
    }

    console.log(`📝 FieldCalculation: Processing ${calculation.condition_logic.length} rule(s)`);

    // Process calculation rules sequentially
    let result: any = undefined;

    for (let i = 0; i < calculation.condition_logic.length; i++) {
      const rule = calculation.condition_logic[i];
      console.log(`\n🔄 FieldCalculation: Processing rule ${i + 1}:`, rule);

      const previousResult = result;
      result = this.evaluateCalculationRule(rule, formData, result);

      console.log(`📊 FieldCalculation: Rule ${i + 1} result:`, {
        previousValue: previousResult,
        newValue: result,
        rule: rule
      });
    }

    console.log('✅ FieldCalculation: Final calculation result:', result);
    return result;
  }

  /**
   * Evaluate a single calculation rule
   */
  private evaluateCalculationRule(
    rule: CalculationRule,
    formData: { [key: string]: any },
    previousResult?: any
  ): any {
    console.log('🧮 FieldCalculation: Evaluating rule:', {
      operation: rule.operation,
      field: rule.field,
      value: rule.value,
      previousResult: previousResult
    });

    // Handle sum operation
    if (rule.operation === 'sum' && Array.isArray(rule.value)) {
      console.log('➕ FieldCalculation: Performing SUM operation on fields:', rule.value);
      let sum = 0;
      const sumDetails: any[] = [];

      for (const fieldName of rule.value) {
        if (fieldName.startsWith('-')) {
          // Negative value
          const actualFieldName = fieldName.substring(1);
          const fieldValue = formData[actualFieldName];
          const numericValue = this.getNumericValue(fieldValue);
          sum -= numericValue;
          sumDetails.push({ field: actualFieldName, value: fieldValue, numeric: -numericValue, operation: 'subtract' });
        } else {
          const fieldValue = formData[fieldName];
          const numericValue = this.getNumericValue(fieldValue);
          sum += numericValue;
          sumDetails.push({ field: fieldName, value: fieldValue, numeric: numericValue, operation: 'add' });
        }
      }

      console.log('📊 FieldCalculation: SUM details:', sumDetails);
      console.log('✅ FieldCalculation: SUM result:', sum);
      return sum;
    }

    // Get the base value
    let baseValue: any;
    if (rule.field) {
      baseValue = formData[rule.field];
      console.log(`📌 FieldCalculation: Base value from field "${rule.field}":`, baseValue);
    } else if (previousResult !== undefined) {
      baseValue = previousResult;
      console.log('📌 FieldCalculation: Base value from previous result:', baseValue);
    } else {
      baseValue = 0;
      console.log('📌 FieldCalculation: No base value, defaulting to 0');
    }

    // Get the operation value
    let operationValue: any = rule.value;
    if (rule.value && typeof rule.value === 'object' && rule.value.field) {
      // This is a field reference
      operationValue = formData[rule.value.field];
      console.log(`📌 FieldCalculation: Operation value from field "${rule.value.field}":`, operationValue);
    } else {
      console.log('📌 FieldCalculation: Operation value (literal):', operationValue);
    }

    console.log(`🎯 FieldCalculation: Performing ${rule.operation}: ${baseValue} ${rule.operation} ${operationValue}`);

    // Perform the operation
    switch (rule.operation) {
      case 'copy':
      case '=':
        console.log(`✅ FieldCalculation: COPY/ASSIGN result: ${operationValue}`);
        return operationValue;

      case '+':
        const addResult = this.getNumericValue(baseValue) + this.getNumericValue(operationValue);
        console.log(`✅ FieldCalculation: ADD result: ${this.getNumericValue(baseValue)} + ${this.getNumericValue(operationValue)} = ${addResult}`);
        return addResult;

      case '-':
        const subResult = this.getNumericValue(baseValue) - this.getNumericValue(operationValue);
        console.log(`✅ FieldCalculation: SUBTRACT result: ${this.getNumericValue(baseValue)} - ${this.getNumericValue(operationValue)} = ${subResult}`);
        return subResult;

      case '*':
        const mulResult = this.getNumericValue(baseValue) * this.getNumericValue(operationValue);
        console.log(`✅ FieldCalculation: MULTIPLY result: ${this.getNumericValue(baseValue)} * ${this.getNumericValue(operationValue)} = ${mulResult}`);
        return mulResult;

      case '/':
        const divisor = this.getNumericValue(operationValue);
        if (divisor === 0) {
          console.warn('⚠️ FieldCalculation: Division by zero, returning 0');
          return 0;
        }
        const divResult = this.getNumericValue(baseValue) / divisor;
        console.log(`✅ FieldCalculation: DIVIDE result: ${this.getNumericValue(baseValue)} / ${divisor} = ${divResult}`);
        return divResult;

      case '**':
        const powResult = Math.pow(this.getNumericValue(baseValue), this.getNumericValue(operationValue));
        console.log(`✅ FieldCalculation: POWER result: ${this.getNumericValue(baseValue)} ** ${this.getNumericValue(operationValue)} = ${powResult}`);
        return powResult;

      default:
        console.warn('⚠️ FieldCalculation: Unknown operation:', rule.operation);
        return baseValue;
    }
  }

  /**
   * Convert value to number, handling various formats
   */
  private getNumericValue(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Get fields that a calculated field depends on
   */
  getFieldDependencies(field: ServiceFlowField): string[] {
    const dependencies = new Set<string>();

    if (!field.calculations) {
      return [];
    }

    field.calculations.forEach(calculation => {
      calculation.condition_logic.forEach(rule => {
        // Add field from rule
        if (rule.field) {
          dependencies.add(rule.field);
        }

        // Add field references in value
        if (rule.value) {
          if (typeof rule.value === 'object' && rule.value.field) {
            dependencies.add(rule.value.field);
          } else if (Array.isArray(rule.value)) {
            // For sum operations
            rule.value.forEach(fieldName => {
              if (typeof fieldName === 'string') {
                // Remove negative sign if present
                const cleanFieldName = fieldName.startsWith('-') ? fieldName.substring(1) : fieldName;
                dependencies.add(cleanFieldName);
              }
            });
          }
        }
      });
    });

    return Array.from(dependencies);
  }
}
