import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
 CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function WeightTrackerApp() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("weightTrackerEntries");

    if (savedEntries) {
      try {
        return JSON.parse(savedEntries);
      } catch (error) {
        console.error("Failed to load saved entries:", error);
      }
    }

    return [
      {
        id: 1,
        date: "2026-05-12",
        weight: 232.4,
        calories: 2850,
      },
      {
        id: 2,
        date: "2026-05-13",
        weight: 231.8,
        calories: 2725,
      },
      {
        id: 3,
        date: "2026-05-14",
        weight: 231.5,
        calories: 2680,
      },
      {
        id: 4,
        date: "2026-05-19",
        weight: 230.9,
        calories: 2550,
      },
    ];
  });

  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      "weightTrackerEntries",
      JSON.stringify(entries)
    );
  }, [entries]);

  const addEntry = () => {
    if (!date || !weight || !calories) {
      setError("Please enter a date, weight, and calories.");
      return;
    }

    const parsedWeight = parseFloat(weight);
    const parsedCalories = parseInt(calories, 10);

    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setError("Please enter a valid body weight.");
      return;
    }

    if (Number.isNaN(parsedCalories) || parsedCalories <= 0) {
      setError("Please enter valid calories.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      date,
      weight: parsedWeight,
      calories: parsedCalories,
    };

    const updatedEntries = [...entries, newEntry].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    setEntries(updatedEntries);
    setDate("");
    setWeight("");
    setCalories("");
    setError("");
  };

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setWeight(entry.weight.toString());
    setCalories(entry.calories.toString());
    setError("");
  };

  const updateEntry = () => {
    if (!date || !weight || !calories) {
      setError("Please enter a date, weight, and calories.");
      return;
    }

    const parsedWeight = parseFloat(weight);
    const parsedCalories = parseInt(calories, 10);

    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setError("Please enter a valid body weight.");
      return;
    }

    if (Number.isNaN(parsedCalories) || parsedCalories <= 0) {
      setError("Please enter valid calories.");
      return;
    }

    const updatedEntries = entries
      .map((entry) =>
        entry.id === editingId
          ? {
              ...entry,
              date,
              weight: parsedWeight,
              calories: parsedCalories,
            }
          : entry
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setEntries(updatedEntries);
    setEditingId(null);
    setDate("");
    setWeight("");
    setCalories("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDate("");
    setWeight("");
    setCalories("");
    setError("");
  };

  const deleteEntry = (id) => {
    setEntries((prevEntries) =>
      prevEntries.filter((entry) => entry.id !== id)
    );
  };

  const getStartOfWeek = (dateString) => {
    const date = new Date(dateString);
    const start = new Date(date);

    start.setHours(0, 0, 0, 0);
    start.setDate(date.getDate() - date.getDay());

    return start.toISOString().split("T")[0];
  };

  const rollingAverages = useMemo(() => {
    if (entries.length === 0) {
      return [];
    }

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return sortedEntries.map((entry, index) => {
      const startIndex = Math.max(0, index - 6);

      const windowEntries = sortedEntries.slice(
        startIndex,
        index + 1
      );

      const averageWeight =
        windowEntries.reduce(
          (sum, current) => sum + current.weight,
          0
        ) / windowEntries.length;

      return {
        date: entry.date,
        rollingAverageWeight: Number(
          averageWeight.toFixed(1)
        ),
      };
    });
  }, [entries]);

  const currentRollingAverage =
    rollingAverages.length > 0
      ? rollingAverages[rollingAverages.length - 1]
          .rollingAverageWeight
      : null;

  const weeklyAverages = useMemo(() => {
    const groupedWeeks = {};

    entries.forEach((entry) => {
      const weekKey = getStartOfWeek(entry.date);

      if (!groupedWeeks[weekKey]) {
        groupedWeeks[weekKey] = {
          weights: [],
          calories: [],
        };
      }

      groupedWeeks[weekKey].weights.push(entry.weight);
      groupedWeeks[weekKey].calories.push(entry.calories);
    });

    return Object.keys(groupedWeeks)
      .sort()
      .map((week) => {
        const weights = groupedWeeks[week].weights;
        const calories = groupedWeeks[week].calories;

        const averageWeight =
          weights.reduce((sum, current) => sum + current, 0) /
          weights.length;

        const averageCalories =
          calories.reduce((sum, current) => sum + current, 0) /
          calories.length;

        return {
          week,
          averageWeight: Number(averageWeight.toFixed(1)),
          averageCalories: Number(averageCalories.toFixed(0)),
        };
      });
  }, [entries]);

  const currentAverageWeight =
    weeklyAverages.length > 0
      ? weeklyAverages[weeklyAverages.length - 1].averageWeight
      : null;

  const previousAverageWeight =
    weeklyAverages.length > 1
      ? weeklyAverages[weeklyAverages.length - 2].averageWeight
      : null;

  const currentAverageCalories =
    weeklyAverages.length > 0
      ? weeklyAverages[weeklyAverages.length - 1]
          .averageCalories
      : null;

  const previousAverageCalories =
    weeklyAverages.length > 1
      ? weeklyAverages[weeklyAverages.length - 2]
          .averageCalories
      : null;

  const estimatedMaintenanceCalories = useMemo(() => {
    if (weeklyAverages.length < 2) {
      return null;
    }

    const recentWeeks = weeklyAverages.slice(-4);

    if (recentWeeks.length < 2) {
      return null;
    }

    const maintenanceEstimates = [];

    for (let index = 1; index < recentWeeks.length; index++) {
      const currentWeek = recentWeeks[index];
      const previousWeek = recentWeeks[index - 1];

      const weightDifference =
        currentWeek.averageWeight - previousWeek.averageWeight;

      const dailyWeightChange = weightDifference / 7;

      const calorieAdjustment = dailyWeightChange * 3500;

      const estimatedMaintenance =
        currentWeek.averageCalories - calorieAdjustment;

      maintenanceEstimates.push(estimatedMaintenance);
    }

    const averagedMaintenance =
      maintenanceEstimates.reduce(
        (sum, current) => sum + current,
        0
      ) / maintenanceEstimates.length;

    return Math.round(averagedMaintenance);
  }, [weeklyAverages]);

  const maintenanceConfidence = useMemo(() => {
    if (weeklyAverages.length >= 6) {
      return "High Confidence";
    }

    if (weeklyAverages.length >= 4) {
      return "Moderate Confidence";
    }

    if (weeklyAverages.length >= 2) {
      return "Low Confidence";
    }

    return "Not Enough Data";
  }, [weeklyAverages]);

  // =====================================
  // WEEKLY HISTORY FEATURE
  // =====================================

  const getWeekNumber = (dateString) => {
    const date = new Date(dateString);
    const startOfYear = new Date(date.getFullYear(), 0, 1);

    const days = Math.floor(
      (date - startOfYear) / (24 * 60 * 60 * 1000)
    );

    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const groupedWeeklyHistory = {};

  entries.forEach((entry) => {
    const week = getWeekNumber(entry.date);
    const year = new Date(entry.date).getFullYear();
    const key = `${year}-W${week}`;

    if (!groupedWeeklyHistory[key]) {
      groupedWeeklyHistory[key] = [];
    }

    groupedWeeklyHistory[key].push(entry);
  });

  const weeklyHistory = Object.entries(groupedWeeklyHistory)
    .map(([week, weekEntries]) => {
      const averageWeight =
        weekEntries.reduce(
          (sum, entry) => sum + Number(entry.weight || 0),
          0
        ) / weekEntries.length;

      const averageCalories =
        weekEntries.reduce(
          (sum, entry) => sum + Number(entry.calories || 0),
          0
        ) / weekEntries.length;

      return {
        week,
        averageWeight: Number(averageWeight.toFixed(1)),
        averageCalories: Math.round(averageCalories),
        entryCount: weekEntries.length,
      };
    })
    .sort((a, b) => a.week.localeCompare(b.week));

  let trend = "Maintaining";

  if (
    currentAverageWeight !== null &&
    previousAverageWeight !== null
  ) {
    if (currentAverageWeight > previousAverageWeight) {
      trend = "Gaining";
    } else if (currentAverageWeight < previousAverageWeight) {
      trend = "Losing";
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800">
            Weekly Weight & Calorie Tracker
          </h1>

          <p className="text-slate-600 text-lg mt-2">
            Track your body weight, calories, and weekly progress trends.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm text-slate-500">
              Current Weekly Weight
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-800">
              {currentAverageWeight !== null
                ? `${currentAverageWeight} lbs`
                : "--"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm text-slate-500">
              Previous Weekly Weight
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-800">
              {previousAverageWeight !== null
                ? `${previousAverageWeight} lbs`
                : "--"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm text-slate-500">Trend</p>

            <h2 className="text-3xl font-bold mt-2 text-slate-800">
              {trend}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm text-slate-500">
              Current Weekly Average Calories
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-800">
              {currentAverageCalories !== null
                ? `${currentAverageCalories} kcal`
                : "--"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm text-slate-500">
              Previous Weekly Average Calories
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-800">
              {previousAverageCalories !== null
                ? `${previousAverageCalories} kcal`
                : "--"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm text-slate-500">
              7-Day Rolling Average
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-800">
              {currentRollingAverage !== null
                ? `${currentRollingAverage} lbs`
                : "--"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm text-slate-500">
              Estimated Maintenance
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-800">
              {estimatedMaintenanceCalories !== null
                ? `${estimatedMaintenanceCalories} kcal`
                : "--"}
            </h2>

            <p className="text-xs text-slate-500 mt-2">
              Adaptive estimate using up to 4 weeks of calorie and weight trend data.
            </p>

            <p className="text-xs text-blue-600 mt-1 font-medium">
              {maintenanceConfidence}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800">
            {editingId ? "Edit Daily Entry" : "Add Daily Entry"}
          </h2>

          <div className="grid gap-4 md:grid-cols-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-300 rounded-2xl p-3 text-lg outline-none focus:ring-2 focus:ring-slate-400"
            />

            <input
              type="number"
              step="0.1"
              placeholder="Weight (lbs)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="border border-slate-300 rounded-2xl p-3 text-lg outline-none focus:ring-2 focus:ring-slate-400"
            />

            <input
              type="number"
              placeholder="Calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="border border-slate-300 rounded-2xl p-3 text-lg outline-none focus:ring-2 focus:ring-slate-400"
            />

            {editingId ? (
              <div className="flex gap-3">
                <button
                  onClick={updateEntry}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl p-3 text-lg font-semibold transition-all w-full"
                >
                  Save Changes
                </button>

                <button
                  onClick={cancelEditing}
                  className="bg-slate-300 hover:bg-slate-200 text-slate-800 rounded-2xl p-3 text-lg font-semibold transition-all w-full"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={addEntry}
                className="bg-slate-800 hover:bg-slate-700 text-white rounded-2xl p-3 text-lg font-semibold transition-all"
              >
                Add Entry
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-2xl p-3">
              {error}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">
              Weekly Weight Chart
            </h2>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="averageWeight"
                    stroke="#0f172a"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">
              Weekly Calories Chart
            </h2>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="averageCalories"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Daily Entries
          </h2>

          {entries.length === 0 ? (
            <p className="text-slate-500">No entries added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="p-3">Date</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">Calories</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100"
                    >
                      <td className="p-3">{entry.date}</td>
                      <td className="p-3">{entry.weight} lbs</td>
                      <td className="p-3">{entry.calories} kcal</td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(entry)}
                            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-xl transition-all"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Features Included
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-slate-700 text-lg">
            <li>Daily body weight tracking</li>
            <li>Daily calorie tracking</li>
            <li>Automatic weekly weight averages</li>
            <li>Automatic weekly calorie averages</li>
            <li>Weight trend analysis</li>
            <li>Adaptive maintenance calorie calculation</li>
            <li>Maintenance confidence scoring</li>
            <li>Interactive progress charts</li>
            <li>Edit previous entries</li>
            <li>Delete entry functionality</li>
            <li>Responsive mobile-friendly layout</li>
            <li>Built-in sample test data</li>
            <li>Automatic local data saving between sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


/*
=================================
CREATE THESE FILES SEPARATELY
=================================

public/manifest.json

{
  "name": "Weight Tracker",
  "short_name": "Tracker",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#f1f5f9",
  "theme_color": "#0f172a",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

---------------------------------
public/sw.js
---------------------------------

const CACHE_NAME = "weight-tracker-cache-v1";

const urlsToCache = [
  "/",
  "/index.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

---------------------------------
src/main.jsx
Add BELOW ReactDOM.createRoot
---------------------------------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

---------------------------------
index.html
Add inside <head>
---------------------------------

<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0f172a" />
*/



