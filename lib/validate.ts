import * as yup from "yup";
import capitalize from "lodash/capitalize";
import moment from "moment-timezone";
import ValidationErrors from "./validation-errors";

export const validate = async (
  data: object,
  schema: yup.MixedSchema
): Promise<void> => {
  try {
    await schema.validate(data, { abortEarly: false });
  } catch (error) {
    const { inner } = error as yup.ValidationError;
    const errors: Record<string, string> = {};
    inner.forEach(({ path, message }): void => {
      errors[path] = capitalize(message);
    });
    throw ValidationErrors(errors);
  }
};

export const validateTimezone = (): yup.StringSchema<string> => {
  return yup
    .string()
    .test(
      "is-valid",
      "Timezone is not valid",
      (value: string | undefined): boolean => {
        // Dont run the test if value is undefined
        if (value == null) return true;
        if (moment.tz.names().find((name): boolean => name === value))
          return true;
        return false;
      }
    );
};
