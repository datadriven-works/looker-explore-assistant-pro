export type FieldType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'date_date'
  | 'date_time'
  | 'date_hour'
  | 'date_hour_of_day'
  | 'date_millisecond'
  | 'date_minute'
  | 'date_month'
  | 'date_month_num'
  | 'date_quarter'
  | 'date_quarter_of_year'
  | 'date_second'
  | 'date_time_of_day'
  | 'date_week'
  | 'date_day_of_week'
  | 'date_week_of_year'
  | 'date_year'
  | 'date_day_of_year'
  | 'location'
  | 'location_latitude'
  | 'location_longitude'

export interface Field {
  name: string
  type: FieldType
}

export interface FilterExpression {
  [key: string]: string[]
}


export class ExploreFilterValidator {
  private static isRealDate(dateString: string): boolean {
    const parts = dateString.split(/[-/]/).map(Number);
  
    // Handle year-month-day (YYYY-MM-DD or YYYY/MM/DD)
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (!year || month < 1 || month > 12 || !day) return false; // Validate month and day
      const date = new Date(year, month - 1, day); // JavaScript months are 0-indexed
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    }
  
    // Handle year-month (YYYY-MM or YYYY/MM)
    if (parts.length === 2) {
      const [year, month] = parts;
      if (!year || month < 1 || month > 12) return false; // Validate month
      return true; // Valid year and month
    }
  
    // Handle year only (YYYY)
    if (parts.length === 1) {
      const [year] = parts;
      return year > 0; // Ensure year is positive
    }
  
    // If none of the valid formats match
    return false;
  }
  

  static isValidStringFilter(filter: string): boolean {
    const rules: ((f: string) => boolean)[] = [
      (f) => /^[^%,]+$/.test(f), // Exact match
      (f) => /^[^%,]+(,[^%,]+)+$/.test(f), // Multiple exact matches
      (f) => /^%[^%]+%$/.test(f), // Contains
      (f) => /^[^%]+%$/.test(f), // Starts with
      (f) => /^%[^%]+$/.test(f), // Ends with
      (f) => /^[^%]+%[^%]+$/.test(f), // Starts with and ends with
      (f) => f === 'EMPTY' || f === 'NULL', // EMPTY or NULL
      (f) => /^-[^%,]+$/.test(f), // Not equal to
      (f) => /^-(%[^%]+%|[^%]+%|%[^%]+)$/.test(f), // Not contains, not starts with, not ends with
      (f) => f === '-EMPTY' || f === '-NULL', // Not EMPTY or not NULL
      (f) => /^[^%]+%(,[^%,]+)+$/.test(f), // Starts with or exact match
      (f) => /^_[^%]+$/.test(f), // Single character wildcard
      (f) => /^\d{4}(-|\/)\d{2}(-|\/)\d{2}$/.test(f) && this.isRealDate(f),
    ]

    return rules.some((rule) => rule(filter))
  }

  static isValidNumberFilter(filter: string): boolean {
    const singleRules: ((f: string) => boolean)[] = [
      (f) => /^-?\d+(\.\d+)?$/.test(f), // Exact number (including negative)
      (f) => /^NOT\s+-?\d+(\.\d+)?$/.test(f), // NOT number
      (f) => /^(<>|!=|[<>]=?)-?\d+(\.\d+)?$/.test(f), // Relational operators
      (f) => /^(-?\d+(\.\d+)?(,\s*-?\d+(\.\d+)?)+)$/.test(f), // List of numbers
      (f) => /^NOT\s+(-?\d+(\.\d+)?(,\s*-?\d+(\.\d+)?)+)$/.test(f), // NOT list of numbers
      (f) => /^-?\d+(\.\d+)?\s+to\s+-?\d+(\.\d+)?$/.test(f), // Range
      (f) => /^to\s+-?\d+(\.\d+)?$/.test(f), // "to X" (X or less)
      (f) => /^-?\d+(\.\d+)?\s+to$/.test(f), // "X to" (X or greater)
      (f) => /^NULL$/.test(f), // NULL
      (f) => /^NOT\s+NULL$/.test(f), // NOT NULL
      (f) => /^[\[(]-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?[\])]$/.test(f), // Single interval notation
      (f) => /^NOT\s+[\[(]-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?[\])]$/.test(f), // NOT single interval
      (f) => /^[\[(](-inf|-?\d+(\.\d+)?),\s*(inf|-?\d+(\.\d+)?)[\])]$/.test(f), // Interval with infinity
      (f) =>
        /^([\[(]-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?[\])])(,\s*([\[(]-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?[\])])+)$/.test(
          f,
        ), // Multiple intervals
      (f) =>
        /^([\[(]-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?[\])])\s*,\s*-?\d+(\.\d+)?$/.test(
          f,
        ), // Interval and exact number
      (f) =>
        /^-?\d+(\.\d+)?\s*,\s*[\[(]-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?[\])]$/.test(
          f,
        ), // Exact number and interval
      (f) => /^NOT\s+(-?\d+(\.\d+)?\s+to\s+-?\d+(\.\d+)?)$/.test(f), // NOT range
      (f) => /^((-?\d+(\.\d+)?|NOT\s+-?\d+(\.\d+)?)(,\s*|$))+$/.test(f), // Combination of exact and NOT
    ]

    const complexRules: ((f: string) => boolean)[] = [
      (f) => /^(>=|>)-?\d+(\.\d+)?\s+AND\s+(<=|<)-?\d+(\.\d+)?$/.test(f), // AND range
      (f) => /^(<|<=)-?\d+(\.\d+)?\s+OR\s+(>|>=)-?\d+(\.\d+)?$/.test(f), // OR range
    ]

    const parts = filter.split(/\s+OR\s+/)
    return parts.every(
      (part) =>
        singleRules.some((rule) => rule(part)) ||
        complexRules.some((rule) => rule(part)),
    )
  }

  static isValidDateFilter(filter: string): boolean {
    const rules: ((f: string) => boolean)[] = [
      // this {interval}
      (f) => /^this\s+(week|month|quarter|year|fiscal\s+quarter|fiscal\s+year)$/.test(f),

      // last {n} {interval}
      (f) =>
        /^last\s+(\d+\s+)?(second|minute|hour|day|week|month|quarter|year|fiscal\s+quarter|fiscal\s+year)s?$/.test(
          f,
        ),

      // next {n} {interval}
      (f) =>
        /^next\s+(\d+\s+)?(second|minute|hour|day|week|month|quarter|year|fiscal\s+quarter|fiscal\s+year)s?$/.test(
          f,
        ),

      // {n} {interval}, {n} {interval} ago
      (f) =>
        /^\d+\s+(second|minute|hour|day|week|month|year)s?(\s+ago)?$/.test(f),

      // {n} {interval} ago for {n} {interval}
      (f) =>
        /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago\s+for\s+\d+\s+(second|minute|hour|day|week|month|year)s?$/.test(
          f,
        ),

      // {n} {interval} from now, {n} {interval} from now for {n} {interval}
      (f) =>
        /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+from\s+now(\s+for\s+\d+\s+(second|minute|hour|day|week|month|year)s?)?$/.test(
          f,
        ),

      // before {n} {interval} ago
      (f) =>
        /^before\s+\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/.test(
          f,
        ),

      // before {time}, after {time}
      (f) =>
        /^(before|after)\s+\d{4}(-|\/)\d{2}(-|\/)\d{2}(\s+\d{2}:\d{2}:\d{2})?$/.test(
          f,
        ),

      // {time} to {time}
      (f) =>
        /^\d{4}(-|\/)\d{2}(-|\/)\d{2}(\s+\d{2}:\d{2}:\d{2})?\s+to\s+\d{4}(-|\/)\d{2}(-|\/)\d{2}(\s+\d{2}:\d{2}:\d{2})?$/.test(
          f,
        ),

      // today, yesterday, tomorrow
      (f) => /^(today|yesterday|tomorrow)$/.test(f),

      // {day of week}
      (f) =>
        /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(f),

      // this {interval} to {interval}
      (f) =>
        /^this\s+(year|month|week|quarter|fiscal\s+year)\s+to\s+(second|minute|hour|day|week|month|quarter|year|fiscal\s+year)$/.test(
          f,
        ),

      // {time} for {n} {interval}
      (f) =>
        /^\d{4}(-|\/)\d{2}(-|\/)\d{2}(\s+\d{2}:\d{2}:\d{2})?\s+for\s+\d+\s+(second|minute|hour|day|week|month|year)s?$/.test(
          f,
        ),

      // FY{year}, FY{year}-Q{quarter}
      (f) => /^FY\d{4}$/.test(f),
      (f) => /^FY\d{4}-Q[1-4]$/.test(f),

      // Absolute Dates
      (f) => /^\d{4}(\/|-)\d{2}(\/|-)\d{2}$/.test(f) && this.isRealDate(f),
      (f) => /^\d{4}(\/|-)\d{2}$/.test(f) && this.isRealDate(f),
      (f) => /^\d{4}$/.test(f) && this.isRealDate(f),

      // {time} for {n} {interval} (using slashes or dashes)
      (f) =>
        /^\d{4}(\/|-)\d{2}(\/|-)\d{2}(\s+\d{2}:\d{2}:\d{2})?\s+for\s+\d+\s+(second|minute|hour|day|week|month|year)s?$/.test(
          f,
        ),
    ]

    const parts = filter.split(/\s*,\s*/)
    return parts.every((part) => rules.some((rule) => rule(part)))
  }

  static isValidBooleanFilter(filter: string): boolean {
    return /^(yes|no|true|false)$/i.test(filter)
  }

  static isValidLocationFilter(filter: string): boolean {
    return /^(latitude|longitude):-?\d+(\.\d+)?$/.test(filter)
  }

  static isFilterValid(fieldType: FieldType, filter: string): boolean {
    switch (fieldType) {
      case 'string':
        return this.isValidStringFilter(filter)
      case 'number':
        return this.isValidNumberFilter(filter)
      case 'date':
      case 'date_date':
      case 'date_time':
      case 'date_hour':
      case 'date_hour_of_day':
      case 'date_millisecond':
      case 'date_minute':
      case 'date_month':
      case 'date_month_num':
      case 'date_quarter':
      case 'date_quarter_of_year':
      case 'date_second':
      case 'date_time_of_day':
      case 'date_week':
      case 'date_day_of_week':
      case 'date_week_of_year':
      case 'date_year':
      case 'date_day_of_year':
        return this.isValidDateFilter(filter)
      case 'boolean':
        return this.isValidBooleanFilter(filter)
      case 'location':
      case 'location_latitude':
      case 'location_longitude':
        return this.isValidLocationFilter(filter)
      default:
        return false
    }
  }

  static validateFilters(
    fields: Field[],
    filterExpression: FilterExpression,
  ): boolean {
    const fieldMap = new Map(fields.map((field) => [field.name, field.type]))

    for (const [filterField, filterValues] of Object.entries(
      filterExpression,
    )) {
      if (!fieldMap.has(filterField)) {
        return false // Field does not exist in the field list
      }

      const fieldType = fieldMap.get(filterField)

      for (const filter of filterValues) {
        if (!this.isFilterValid(fieldType!, filter)) {
          return false // Invalid filter expression
        }
      }
    }

    return true // All checks passed
  }
}
