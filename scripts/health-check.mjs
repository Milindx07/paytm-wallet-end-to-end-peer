const targets = [
  ["Web", "http://localhost/login"],
  ["API", "http://localhost/api/health"],
  ["Docs", "http://localhost/api/docs"]
];

async function waitFor(name, url) {
  const deadline = Date.now() + 90_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`${name} is ready: ${url}`);
        return;
      }
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(`${name} did not become healthy at ${url}: ${lastError}`);
}

for (const [name, url] of targets) {
  await waitFor(name, url);
}
