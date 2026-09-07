import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useConversationViewport } from "@/render/conversation/useConversationViewport";

class Viewport extends EventTarget {
  height = 844;
  offsetTop = 0;
  scale = 1;
  changer(valeurs: Partial<Pick<Viewport, "height" | "offsetTop" | "scale">>, evenement = "resize") {
    Object.assign(this, valeurs);
    this.dispatchEvent(new Event(evenement));
  }
}

const ancienViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");
const ancienneHauteur = Object.getOwnPropertyDescriptor(window, "innerHeight");
let viewport: Viewport;

function Fenetre({ active = true }: { active?: boolean }) {
  const ref = useConversationViewport(active);
  return <main ref={ref} data-testid="scene"><textarea aria-label="Message" /></main>;
}

beforeEach(() => {
  viewport = new Viewport();
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 844 });
});

afterEach(() => {
  if (ancienViewport) Object.defineProperty(window, "visualViewport", ancienViewport);
  else Reflect.deleteProperty(window, "visualViewport");
  if (ancienneHauteur) Object.defineProperty(window, "innerHeight", ancienneHauteur);
});

describe("A single visible viewport owns the conversation geometry", () => {
  it("fits an iOS keyboard and its offset without subtracting the keyboard a second time", () => {
    render(<Fenetre />);
    const scene = screen.getByTestId("scene");
    act(() => {
      screen.getByRole("textbox").focus();
      viewport.changer({ height: 430, offsetTop: 74 });
    });
    expect(scene.style.getPropertyValue("--conversation-vh")).toBe("430px");
    expect(scene.style.getPropertyValue("--conversation-top")).toBe("74px");
    expect(scene.hasAttribute("data-clavier-ouvert")).toBe(true);
  });

  it("keeps 430 pixels when Android has already reduced innerHeight to 430", () => {
    render(<Fenetre />);
    const scene = screen.getByTestId("scene");
    act(() => {
      screen.getByRole("textbox").focus();
      window.innerHeight = 430;
      viewport.changer({ height: 430 });
      window.dispatchEvent(new Event("resize"));
    });
    expect(scene.style.getPropertyValue("--conversation-vh")).toBe("430px");
    expect(scene.hasAttribute("data-clavier-ouvert")).toBe(true);
  });

  it("restores navigation when the keyboard closes while the field remains focused", () => {
    render(<Fenetre />);
    act(() => {
      screen.getByRole("textbox").focus();
      viewport.changer({ height: 430 });
      viewport.changer({ height: 844, offsetTop: 0 });
    });
    const scene = screen.getByTestId("scene");
    expect(scene.hasAttribute("data-clavier-ouvert")).toBe(false);
    expect(scene.style.getPropertyValue("--conversation-vh")).toBe("844px");
  });

  it("does not mistake a browser resize or a hardware keyboard for an on-screen keyboard", () => {
    render(<Fenetre />);
    act(() => viewport.changer({ height: 795 }));
    expect(screen.getByTestId("scene").hasAttribute("data-clavier-ouvert")).toBe(false);
    act(() => screen.getByRole("textbox").focus());
    expect(screen.getByTestId("scene").hasAttribute("data-clavier-ouvert")).toBe(false);
  });

  it("returns viewport control to native pinch zoom and resumes when zoom returns to one", () => {
    render(<Fenetre />);
    const scene = screen.getByTestId("scene");
    act(() => {
      screen.getByRole("textbox").focus();
      viewport.changer({ height: 430 });
      viewport.changer({ scale: 1.5, height: 285, offsetTop: 100 });
    });
    expect(scene.hasAttribute("data-viewport-conversation")).toBe(false);
    expect(scene.hasAttribute("data-clavier-ouvert")).toBe(false);
    expect(scene.style.getPropertyValue("--conversation-vh")).toBe("");
    expect(scene.style.getPropertyValue("--conversation-top")).toBe("");
    act(() => viewport.changer({ scale: 1, height: 430, offsetTop: 0 }));
    expect(scene.style.getPropertyValue("--conversation-vh")).toBe("430px");
    expect(scene.hasAttribute("data-clavier-ouvert")).toBe(true);
  });

  it("clears the controlled geometry when leaving Anam and removes listeners when unmounted", () => {
    const { rerender, unmount } = render(<Fenetre />);
    const scene = screen.getByTestId("scene");
    act(() => {
      screen.getByRole("textbox").focus();
      viewport.changer({ height: 430 });
    });
    rerender(<Fenetre active={false} />);
    expect(scene.hasAttribute("data-viewport-conversation")).toBe(false);
    expect(scene.hasAttribute("data-clavier-ouvert")).toBe(false);
    expect(scene.style.getPropertyValue("--conversation-vh")).toBe("");
    unmount();
    act(() => viewport.changer({ height: 400 }));
    expect(scene.style.getPropertyValue("--conversation-vh")).toBe("");
  });

  it("falls back to native viewport CSS when visualViewport is unavailable", () => {
    Object.defineProperty(window, "visualViewport", { configurable: true, value: undefined });
    render(<Fenetre />);
    expect(screen.getByTestId("scene").hasAttribute("data-viewport-conversation")).toBe(false);
  });

  it("tracks viewport scrolling without allowing a negative top offset", () => {
    render(<Fenetre />);
    const scene = screen.getByTestId("scene");
    act(() => viewport.changer({ offsetTop: 42 }, "scroll"));
    expect(scene.style.getPropertyValue("--conversation-top")).toBe("42px");
    act(() => viewport.changer({ offsetTop: -4 }, "scroll"));
    expect(scene.style.getPropertyValue("--conversation-top")).toBe("0px");
  });
});
