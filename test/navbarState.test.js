const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "navbar-state.js"),
  "utf8",
);

function activeItems({ pathname, search = "", hash = "" }) {
  const items = [
    "home",
    "how-it-works",
    "about",
    "get-started",
  ].map((navItem) => {
    const attributes = new Map();
    const classes = new Set();
    return {
      dataset: { navItem },
      attributes,
      classes,
      classList: {
        toggle(name, enabled) {
          if (enabled) classes.add(name);
          else classes.delete(name);
        },
      },
      setAttribute(name, value) {
        attributes.set(name, value);
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
    };
  });
  const window = {
    location: { pathname, search, hash },
    addEventListener() {},
  };
  const document = {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-nav-item]");
      return items;
    },
  };

  vm.runInNewContext(source, { window, document, URLSearchParams });
  return items
    .filter((item) => item.attributes.get("aria-current") === "page")
    .map((item) => item.dataset.navItem);
}

test("navbar marks only Home active on the homepage", () => {
  assert.deepEqual(activeItems({ pathname: "/" }), ["home"]);
});

test("Home stays active on the homepage even at the How it works section", () => {
  assert.deepEqual(activeItems({ pathname: "/", hash: "#how-it-works" }), [
    "home",
  ]);
  assert.deepEqual(
    activeItems({ pathname: "/how-it-works", hash: "#how-it-works" }),
    ["how-it-works"],
  );
});

test("informational pages activate only their matching navigation item", () => {
  assert.deepEqual(activeItems({ pathname: "/how-it-works" }), [
    "how-it-works",
  ]);
  assert.deepEqual(activeItems({ pathname: "/about" }), ["about"]);
});

test("Get started is active for the single login authentication destination", () => {
  assert.deepEqual(activeItems({ pathname: "/login" }), ["get-started"]);
  assert.deepEqual(
    activeItems({ pathname: "/login", search: "?mode=signup" }),
    ["get-started"],
  );
  assert.deepEqual(
    activeItems({ pathname: "/login", search: "?mode=signup&next=/estimate" }),
    ["get-started"],
  );
});

test("public navbar markup keeps the required items and destinations", () => {
  const publicPages = ["index.html", "home.html", "about.html", "how-it-works.html"];
  for (const page of publicPages) {
    const html = fs.readFileSync(
      path.join(__dirname, "..", "public", page),
      "utf8",
    );
    assert.match(html, /data-nav-item="home"|>Home</);
    assert.match(html, /href="\/how-it-works"/);
    assert.match(html, /href="\/about"/);
    assert.match(html, /data-nav-item="get-started"/);
    assert.doesNotMatch(html, />Features</);
    assert.doesNotMatch(html, />Log in</);
    assert.doesNotMatch(html, /href="\/login\?mode=signup"/);
  }

  const publicSite = fs.readFileSync(
    path.join(__dirname, "..", "public", "public-site.js"),
    "utf8",
  );
  assert.match(publicSite, /addNavLink\(nav, "Home", "\/", "", "home"\)/);
  assert.match(publicSite, /"Get started",\s*"\/login"/);
  assert.doesNotMatch(publicSite, /addNavLink\(nav, "Log in"/);
});
