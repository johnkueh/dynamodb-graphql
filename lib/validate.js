import * as yup from "yup";
import capitalize from "lodash/capitalize";
import moment from "moment-timezone";
import ValidationErrors from "./validation-errors";

export const validate = async (data, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
  } catch (error) {
    const { name, inner } = error;
    const errors = {};
    inner.forEach(({ path, message }) => {
      errors[path] = capitalize(message);
    });
    throw ValidationErrors(errors);
  }
};

export const validateTimezone = () => {
  return yup.string().test("is-valid", "Timezone is not valid", value => {
    // Dont run the test if value is undefined
    if (value == null) return true;

    return moment.tz.names().find(name => name === value);
  });
};
