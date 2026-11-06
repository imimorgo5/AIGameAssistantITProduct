export function bindClasses(...modules: Readonly<Record<string, string>>[]) {
  return (value: string) =>
    value
      .split(/\s+/)
      .map((name) => {
        const matches = modules.flatMap((module) =>
          module[name] ? [module[name]] : [],
        );

        return matches.length ? matches.join(" ") : name;
      })
      .join(" ");
}
