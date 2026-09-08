import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LectureNumerologie from "@/render/socle/LectureNumerologie";

const lecture = { id: "lecture-1", annee: 2026, guidanceAnnee: "Une piste pour cette année.", visionLongTerme: "Une perspective durable.", portrait: "Tu pourrais aimer prendre du recul.", note: null as number | null, partageAnam: false };
const reponse = (corps: unknown, status = 200) => ({ ok: status < 400, status, json: async () => corps });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("only reads on mount, then generates after an explicit click", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(reponse({ lecture: null })).mockResolvedValueOnce(reponse({ lecture }));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  render(<LectureNumerologie />);
  await screen.findByRole("button", { name: "Créer ma lecture" });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1].method).toBe("GET");
  await user.click(screen.getByRole("button", { name: "Créer ma lecture" }));
  await screen.findByText(lecture.portrait);
  expect(fetcher.mock.calls[1][1].method).toBe("POST");
  expect(fetcher.mock.calls[1][1].body).toBe("{}");
  expect(screen.getByText(lecture.visionLongTerme)).toBeTruthy();
});

it("distinguishes a cache read error from an empty cache", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(reponse({ message: "Lecture indisponible." }, 503)).mockResolvedValueOnce(reponse({ lecture }));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  render(<LectureNumerologie />);
  await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Créer ma lecture" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Recharger ma lecture" }));
  await screen.findByText(lecture.portrait);
  expect(fetcher.mock.calls.map((call) => call[1].method)).toEqual(["GET", "GET"]);
});

it("rating 4 never offers sharing; rating 5 requires a separate share action, then withdrawal", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(reponse({ lecture }))
    .mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 4 } }))
    .mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5 } }))
    .mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5, partageAnam: true } }))
    .mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5, partageAnam: false } }));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  render(<LectureNumerologie />);
  await user.click(await screen.findByRole("radio", { name: "4 sur 5 : Beaucoup" }));
  await waitFor(() => expect((screen.getByRole("radio", { name: "4 sur 5 : Beaucoup" }) as HTMLInputElement).checked).toBe(true));
  expect(screen.queryByRole("button", { name: "Confier ce portrait à Anam" })).toBeNull();
  await user.click(screen.getByRole("radio", { name: "5 sur 5 : Tout à fait" }));
  await screen.findByRole("button", { name: "Confier ce portrait à Anam" });
  expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({ id: lecture.id, note: 5, partagerAnam: false });
  await user.click(screen.getByRole("button", { name: "Confier ce portrait à Anam" }));
  await screen.findByRole("button", { name: "Retirer le partage avec Anam" });
  expect(JSON.parse(fetcher.mock.calls[3][1].body).partagerAnam).toBe(true);
  await user.click(screen.getByRole("button", { name: "Retirer le partage avec Anam" }));
  await screen.findByRole("button", { name: "Confier ce portrait à Anam" });
  expect(JSON.parse(fetcher.mock.calls[4][1].body).partagerAnam).toBe(false);
});

it("a lower rating withdraws sharing and is only shown after acknowledgment", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5, partageAnam: true } }))
    .mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 2, partageAnam: false } }));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  render(<LectureNumerologie />);
  await user.click(await screen.findByRole("radio", { name: "2 sur 5 : Peu" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Retirer le partage avec Anam" })).toBeNull());
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ id: lecture.id, note: 2, partagerAnam: false });
});

it("an uncertain rating save requires reloading and does not unlock sharing", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 4 } }))
    .mockResolvedValueOnce(reponse({ message: "Ton choix n’a pas été enregistré." }, 503)));
  const user = userEvent.setup();
  render(<LectureNumerologie />);
  await user.click(await screen.findByRole("radio", { name: "5 sur 5 : Tout à fait" }));
  await screen.findByRole("alert");
  expect(screen.queryByRole("radio")).toBeNull();
  expect(screen.getByRole("button", { name: "Recharger ma lecture" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Confier ce portrait à Anam" })).toBeNull();
});

it.each(["network", "read-after-write"])("recovers a committed share after %s failure", async failure => {
  const fetcher = vi.fn().mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5 } }));
  if (failure === "network") fetcher.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  else fetcher.mockResolvedValueOnce(reponse({ code: "notation_indisponible" }, 503));
  fetcher.mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5, partageAnam: true } }))
    .mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5, partageAnam: false } }));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  render(<LectureNumerologie />);
  await user.click(await screen.findByRole("button", { name: "Confier ce portrait à Anam" }));
  expect((await screen.findByRole("alert")).textContent).toContain("n’a pas pu être confirmé");
  await user.click(screen.getByRole("button", { name: "Recharger ma lecture" }));
  await user.click(await screen.findByRole("button", { name: "Retirer le partage avec Anam" }));
  await screen.findByRole("button", { name: "Confier ce portrait à Anam" });
  expect(fetcher.mock.calls.map(call => call[1].method)).toEqual(["GET", "PATCH", "GET", "PATCH"]);
});

it("discards a stale portrait and its sharing controls", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(reponse({ lecture: { ...lecture, note: 5 } }))
    .mockResolvedValueOnce(reponse({ code: "lecture_perimee", message: "Tes repères ont changé." }, 409)));
  const user = userEvent.setup();
  render(<LectureNumerologie />);
  await user.click(await screen.findByRole("button", { name: "Confier ce portrait à Anam" }));
  await screen.findByRole("alert");
  expect(screen.queryByText(lecture.portrait)).toBeNull();
  expect(screen.queryByRole("radio")).toBeNull();
  expect(screen.getByRole("button", { name: "Recharger ma lecture" })).toBeTruthy();
});
