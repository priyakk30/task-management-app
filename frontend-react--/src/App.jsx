import { useEffect, useState } from "react";
import "./App.css";

const API_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [success, setSuccess] = useState("")
  
   function startEditing(task) {
     setEditingId(task._id);
     setEditTitle(task.title);
     setEditDescription(task.description || "");
     setError("");
    }
      function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    }
    async function saveTask(id) {
   if (!editTitle.trim()) {
    setError("Task title cannot be empty");
    return;
   }

   try {
    setError("");

    console.log("Saving task Id:", id);
    console.log("New title:", editTitle);

    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim()
      })
     });

    const data = await response.json();
    console.log("Server response:", response.status, data);

    if (!response.ok) {
      throw new Error(data.message || "Could not update task");
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === id ? data : task
      )
    );

    cancelEditing();
    setSuccess("Task updated successfully!")
    
   } catch (err) {
    console.log("save error:", err);
    setError(err.message || "Could not save task");
   }
  }
   const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
   });
  async function fetchTasks() {
    try {
      setError("");
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch {
      setError("Cannot connect to the server. Is your backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function addTask(event) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add task");
      }

      setTasks((currentTasks) => [data, ...currentTasks]);
      setTitle("");
      setDescription("");
      setSuccess("Task added successfully!");
    } catch (err) {
      setError(err.message || "Could not add task");
    }
  }

  async function toggleTask(task) {
    try {
      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update task");
      }

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item._id === task._id ? data : item
        )
      );
    } catch (err) {
      setError(err.message || "Could not update task");
    }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete task");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task._id !== id)
      );
      setSuccess("Task deleted successfully!");
    } catch (err) {
      setError(err.message || "Could not delete task");
    }
  }
  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  return (
    <main className="app">
      <header className="header">
        <p className="eyebrow">MY WORKSPACE</p>
        <h1>Task Manager</h1>
        <p className="subtitle">
          Organize your day, one task at a time.
        </p>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat-card">
          <span>Pending</span>
          <strong>{tasks.length - completedCount}</strong>
        </div>

        <div className="stat-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Add a new task</h2>

        <form onSubmit={addTask}>
          <label htmlFor="title">Task title</label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add some details (optional)"
            rows="3"
          />

          <button className="add-button" type="submit">
            + Add task
          </button>
        </form>
      </section>

      <section className="task-section">
        <div className="task-heading">
          <h2>Your tasks</h2>

          <select
            aria-label="Filter tasks"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>}
        {success && (<p className="success.message">{success}</p>)}

        {loading ? (
          <p className="empty">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="empty">No tasks here yet. Add your first task!</p>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => (
              <article className="task-card" key={task._id}>
  <input
    className="task-checkbox"
    type="checkbox"
    checked={task.completed}
    onChange={() => toggleTask(task)}
    aria-label={`Complete ${task.title}`}
  />

    <div className="task-content">
    {editingId === task._id ? (
     <div className="edit-form">
      <label>Task title</label>
      <input
        value={editTitle}
        onChange={(event) => setEditTitle(event.target.value)}
      />

      <label>Description</label>
      <textarea
        value={editDescription}
        onChange={(event) => setEditDescription(event.target.value)}
      />

      <button
        type="button"
        className="save-button"
        onClick={() => 
          saveTask(task._id)}
      >
        Save
      </button>

      <button type="button" onClick={cancelEditing}>
        Cancel
      </button>
    </div>
  ) : (
    <>
      <h3 className={task.completed ? "done" : ""}>
        {task.title}
      </h3>

      {task.description && <p>{task.description}</p>}
    </>
  )}
  </div>

  {editingId !== task._id && (
    <div className="task-actions">
      <button
        type="button"
        className="edit-button"
        onClick={() => 
          startEditing(task)}
      >
        Edit
      </button>

      <button
        type="button"
        className="delete-button"
        onClick={() => deleteTask(task._id)}
      >
        Delete
      </button>
    </div>
  )}
 </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;