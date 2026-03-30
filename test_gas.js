const url = "https://script.google.com/macros/s/AKfycbxjyF3mN4bgCjk79ukdf2XGoa5vgf5-MCTius6gtXzPHiCpwEjc4xGWFNPg3kUbPEAiog/exec";

(async () => {
  try {
    console.log("Sending test fetch...");
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        context: "Test",
        name: "Backend Test",
        phone: "0000000000",
        email: "test@domain.com",
        message: "Can you hear me?",
        page: "backend_test"
      }),
      // We do not use no-cors here so we can see the full response
    });
    console.log("Status:", res.status);
    const txt = await res.text();
    console.log("Body:", txt);
  } catch (err) {
    console.error("Fetch error:", err);
  }
})();
