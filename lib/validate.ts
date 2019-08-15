import * as yup from "yup";
import capitalize from "lodash/capitalize";
import moment from "moment-timezone";
import ValidationErrors from "./validation-errors";

export const validate = async (data: object, schema: yup.MixedSchema) => {
  try {
    await schema.validate(data, { abortEarly: false });
  } catch (error) {
    const { inner } = error as yup.ValidationError;
    const errors = {} as Record<string, string>;
    inner.forEach(({ path, message }) => {
      errors[path] = capitalize(message);
    });
    throw ValidationErrors(errors);
  }
};

export const validateTimezone = () => {
  return yup
    .string()
    .test("is-valid", "Timezone is not valid", (value: string | undefined) => {
      // Dont run the test if value is undefined
      if (value == null) return true;
      if (moment.tz.names().find(name => name === value)) return true;
      return false;
    });
};
