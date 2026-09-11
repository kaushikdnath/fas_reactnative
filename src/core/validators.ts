/** Pure, reusable form validators -- no framework dependency, so they're
 *  unit-testable and reusable from CSV import in a later phase. */
const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const Validators = {
  required(value: string | null | undefined, field = 'This field'): string | null {
    if (!value || value.trim().length === 0) return `${field} is required`;
    return null;
  },
  name(value: string | null | undefined, field = 'Name'): string | null {
    const req = Validators.required(value, field);
    if (req) return req;
    if (value!.trim().length < 2) return `${field} must be at least 2 characters`;
    return null;
  },
  mobile(value: string | null | undefined, optional = false): string | null {
    if (!value || value.trim().length === 0) return optional ? null : 'Mobile number is required';
    if (!MOBILE_REGEX.test(value.trim())) return 'Enter a valid 10-digit mobile number';
    return null;
  },
  code(value: string | null | undefined): string | null {
    const req = Validators.required(value, 'Student code');
    if (req) return req;
    if (!/^[A-Za-z0-9-_]+$/.test(value!.trim())) return 'Use letters, numbers, - or _ only';
    return null;
  },
};
