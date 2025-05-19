document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("log-form");
  const chartCtx = document.getElementById("sustainabilityChart").getContext("2d");

  let sustainabilityChart;

  const fetchAndRenderData = async () => {
    const res = await fetch("/sustainability/data");
    const data = await res.json();

    const categories = {};
    data.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = 0;
      }
      categories[item.category] += item.quantity;
    });

    const labels = Object.keys(categories);
    const quantities = Object.values(categories);

    if (sustainabilityChart) sustainabilityChart.destroy();

    sustainabilityChart = new Chart(chartCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Total Saved / Avoided",
          data: quantities,
          backgroundColor: ["#4caf50", "#2196f3", "#ff9800", "#e91e63"],
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity'
            }
          }
        }
      }
    });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/sustainability/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    alert(result.message);
    form.reset();
    fetchAndRenderData();
  });

  fetchAndRenderData();
});
