const admin = {
  id: "admin",
  name: "Admin",
  description: "",
  resources: [
    {
      collection: "books",
      permissions: ["create", "read", "update", "delete"],
    },
    {
      collection: "users",
      permissions: ["read", "update", "delete", "create"],
    },
    {
      collection: "orders",
      permissions: ["create", "read", "update", "delete"],
    },
  ],
};

const librarian = {
  id: "librarian",
  name: "Librarian",
  description: "",
  resources: [
    {
      collection: "books",
      permissions: ["create", "read", "update", "delete"],
    },
    {
      collection: "users",
      permissions: ["read", "update", "delete", "create"],
    },
    {
      collection: "orders",
      permissions: ["create", "read", "update", "delete"],
    },
  ],
};

const faculty = {
  id: "faculty",
  name: "Faculty",
  description: "",
  resources: [
    {
      collection: "books",
      permissions: ["read"],
    },
    {
      collection: "users",
      permissions: ["read", "update", "delete"],
    },
    {
      collection: "orders",
      permissions: ["create", "read", "update", "delete"],
    },
  ],
};

const student = {
  id: "student",
  name: "Student",
  description: "",
  resources: [
    {
      collection: "books",
      permissions: ["read"],
    },
    {
      collection: "users",
      permissions: ["read", "update"],
    },
    {
      collection: "orders",
      permissions: ["create", "read", "update", "delete"],
    },
  ],
};

export { admin, librarian, faculty, student };
