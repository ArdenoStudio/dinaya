import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  BOOKING_REVIEWS_SECTION_ID,
  BusinessRating,
  HIGH_RATING_THRESHOLD,
  scrollToBookingReviews,
} from "./BusinessRating";
import { getBookingCopy } from "@/lib/i18n";

const copy = getBookingCopy("en");

describe("BusinessRating", () => {
  it("renders compact rating with review count for lower scores", () => {
    render(<BusinessRating avgRating={4.2} reviewCount={1500} copy={copy} />);
    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText("1,500 reviews")).toBeInTheDocument();
  });

  it("hides review count for high ratings by default", () => {
    render(
      <BusinessRating avgRating={HIGH_RATING_THRESHOLD} reviewCount={1500} copy={copy} />,
    );
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.queryByText("1,500 reviews")).not.toBeInTheDocument();
  });

  it("can force showing review count for high ratings", () => {
    render(
      <BusinessRating avgRating={4.8} reviewCount={12} copy={copy} showCount />,
    );
    expect(screen.getByText("12 reviews")).toBeInTheDocument();
  });

  it("returns null when there are no reviews", () => {
    const { container } = render(
      <BusinessRating avgRating={4.8} reviewCount={0} copy={copy} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("scrolls to reviews and opens the dialog trigger", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const trigger = document.createElement("button");
    trigger.setAttribute("data-reviews-trigger", "");
    const clickSpy = vi.spyOn(trigger, "click");

    const section = document.createElement("div");
    section.id = BOOKING_REVIEWS_SECTION_ID;
    section.scrollIntoView = scrollIntoView;
    section.appendChild(trigger);
    document.body.appendChild(section);

    render(
      <BusinessRating
        avgRating={4.7}
        reviewCount={1500}
        copy={copy}
        scrollToReviews
      />,
    );

    await user.click(screen.getByRole("button", { name: /rated 4.7/i }));

    expect(scrollIntoView).toHaveBeenCalled();

    await vi.waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });

    section.remove();
  });
});

describe("scrollToBookingReviews", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clicks the reviews trigger after scrolling", () => {
    const trigger = document.createElement("button");
    trigger.setAttribute("data-reviews-trigger", "");
    const clickSpy = vi.spyOn(trigger, "click");

    const section = document.createElement("div");
    section.id = BOOKING_REVIEWS_SECTION_ID;
    section.scrollIntoView = vi.fn();
    section.appendChild(trigger);
    document.body.appendChild(section);

    scrollToBookingReviews();
    vi.advanceTimersByTime(350);

    expect(clickSpy).toHaveBeenCalled();
    section.remove();
  });
});
