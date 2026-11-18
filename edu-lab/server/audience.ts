// The audiences a teacher can choose (server, export script and teacher app).

export const AUDIENCES = ["Middle school", "High school", "Undergraduate"];

/** One of AUDIENCES for any stored audience: older lessons have free text such as "High school physics". */
export const audienceLevel = (s = "") =>
  AUDIENCES.find((a) => s.toLowerCase().startsWith(a.toLowerCase())) || (/college|univ/i.test(s) ? "Undergraduate" : "High school");
