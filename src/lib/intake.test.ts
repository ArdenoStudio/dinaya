import { describe, expect, it } from "vitest";
import { validateIntakeAnswers, type IntakeQuestion } from "./intake";

const q = (over: Partial<IntakeQuestion> & Pick<IntakeQuestion, "id" | "label" | "type">): IntakeQuestion => ({
  required: false,
  ...over,
});

describe("validateIntakeAnswers", () => {
  it("returns no answers when the service has no questions", () => {
    const result = validateIntakeAnswers([], [{ questionId: "x", value: "hi" }]);
    expect(result).toEqual({ ok: true, answers: [] });
  });

  it("accepts an answered required question and snapshots the label", () => {
    const questions = [q({ id: "a", label: "Reason for visit?", type: "text", required: true })];
    const result = validateIntakeAnswers(questions, [{ questionId: "a", value: " Cleaning " }]);
    expect(result).toEqual({
      ok: true,
      answers: [{ questionId: "a", label: "Reason for visit?", value: "Cleaning" }],
    });
  });

  it("rejects a blank required question", () => {
    const questions = [q({ id: "a", label: "Reason for visit?", type: "text", required: true })];
    const result = validateIntakeAnswers(questions, []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Reason for visit?");
  });

  it("drops blank optional questions", () => {
    const questions = [q({ id: "a", label: "Allergies?", type: "text", required: false })];
    const result = validateIntakeAnswers(questions, [{ questionId: "a", value: "" }]);
    expect(result).toEqual({ ok: true, answers: [] });
  });

  it("rejects a select answer that is not one of the options", () => {
    const questions = [q({ id: "s", label: "Type", type: "select", required: true, options: ["A", "B"] })];
    const result = validateIntakeAnswers(questions, [{ questionId: "s", value: "C" }]);
    expect(result.ok).toBe(false);
  });

  it("accepts a valid select answer", () => {
    const questions = [q({ id: "s", label: "Type", type: "select", required: true, options: ["A", "B"] })];
    const result = validateIntakeAnswers(questions, [{ questionId: "s", value: "B" }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.answers[0]?.value).toBe("B");
  });

  it("rejects a boolean answer that is not Yes/No", () => {
    const questions = [q({ id: "b", label: "In pain?", type: "boolean", required: true })];
    const result = validateIntakeAnswers(questions, [{ questionId: "b", value: "maybe" }]);
    expect(result.ok).toBe(false);
  });

  it("snapshots the sensitive flag onto the stored answer", () => {
    const questions = [q({ id: "b", label: "In pain?", type: "boolean", required: true, sensitive: true })];
    const result = validateIntakeAnswers(questions, [{ questionId: "b", value: "Yes" }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.answers[0]).toEqual({ questionId: "b", label: "In pain?", value: "Yes", sensitive: true });
  });
});
