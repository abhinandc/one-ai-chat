import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TopBar } from "../../src/components/shell/TopBar";

const MockTopBar = () => (
  <BrowserRouter>
    <TopBar 
      onToggleSidebar={() => {}}
      onOpenCommandPalette={() => {}}
      onLogout={() => {}}
    />
  </BrowserRouter>
);

describe("TopBar", () => {
  it("renders navigation and controls", () => {
    render(<MockTopBar />);
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("has search functionality", () => {
    render(<MockTopBar />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("has user menu", () => {
    render(<MockTopBar />);
    const userButton = screen.getByRole("button", { name: /user/i });
    expect(userButton).toBeInTheDocument();
  });
});
