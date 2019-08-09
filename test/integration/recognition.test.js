import "../support/globals";
import { query as performQuery } from "../support/apollo-test-helper";
import { Queries } from "../../dynamodb/queries";

describe("Fetching culture values", () => {
  const query = `
    query {
      cultureValues {
        name
      }
    }
  `;
  beforeEach(async () => {
    await Queries.putCulture({ name: "Teamwork", position: 1 });
    await Queries.putCulture({ name: "Integrity", position: 2 });
    await Queries.putCulture({ name: "Helpful", position: 3 });
  });

  it("can fetch culture values without auth", async () => {
    const res = await performQuery({
      query
    });

    expect(res).toMatchSnapshot();
  });
});
