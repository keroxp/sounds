import {fmtms} from "../util";

describe("time", () => {
  test("fmtms", () => {
    // 05:24:524
    const v = fmtms(1000*60*5 + 1000*24+ 524);
    expect(v).toBe("05:24:524")
  })
});