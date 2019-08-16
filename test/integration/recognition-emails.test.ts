import moment from "moment";
import { SES } from "../../lib/ses-client";
import "../support/globals";
import { handler } from "../../services/mood-survey-emailer";
import { dbbStreamForInsertedResponse } from "../support/ddb-streams/responses";
import { Queries } from "../../dynamodb/queries";

describe("Creating new response survey", () => {
  let user;
  let response;
  beforeEach(async () => {
    user = await Queries.createUserWithTeam({
      name: "Darth Vader",
      email: "darth@vader.com",
      password: "password",
      teamName: "Star Wars"
    });

    response = await Queries.createResponse({
      submittedAt: moment("2018-05-10").toISOString(),
      userId: user.id,
      teamId: user.teamId,
      feeling: "HAPPY"
    });
  });

  it("triggers an email on SES when ddb stream received", async () => {
    const spy = jest.spyOn(SES, "sendTemplatedEmail");
    spy.mockImplementation(() => {
      return { promise: jest.fn().mockResolvedValue(true) };
    });

    expect(response.sentAt).toBeUndefined();

    await handler(dbbStreamForInsertedResponse(response));
    const updatedResponse = await Queries.fetchResponseById(response.id);

    expect(spy).toHaveBeenCalledWith({
      Destination: {
        ToAddresses: ["darth@vader.com"]
      },
      Source: "Vibejar <support@vibejar.com>",
      Template: "DailyMoodSurveyEmailTemplate",
      TemplateData: JSON.stringify({
        companyName: "Star Wars"
      })
    });
    expect(updatedResponse.sentAt).toBeDefined();
  });
});
