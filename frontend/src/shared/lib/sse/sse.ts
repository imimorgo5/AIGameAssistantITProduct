export function parseSseEvent(raw: string) {
  let event = "message";
  const data = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();

    if (line.startsWith("data:")) data.push(line.slice(5));
  }

  return {
    event,
    data: data.join("\n"),
  };
}
