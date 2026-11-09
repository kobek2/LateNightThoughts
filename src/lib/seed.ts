import type { StoreData } from "./types";

function votes(
  reactions: StoreData["reactions"],
  takeId: string,
  agree: number,
  disagree: number,
) {
  for (let i = 0; i < agree; i += 1) {
    reactions.push({ takeId, visitorId: `seed-${takeId}-a${i}`, stance: "agree" });
  }
  for (let i = 0; i < disagree; i += 1) {
    reactions.push({ takeId, visitorId: `seed-${takeId}-d${i}`, stance: "disagree" });
  }
}

export function seedStore(): StoreData {
  const reactions: StoreData["reactions"] = [];
  votes(reactions, "p1t1", 7, 2);
  votes(reactions, "p1t2", 5, 1);
  votes(reactions, "p2t1", 6, 1);
  votes(reactions, "p2t2", 4, 2);
  votes(reactions, "p2t3", 3, 1);
  votes(reactions, "p3t1", 8, 3);
  votes(reactions, "p3t2", 9, 1);
  votes(reactions, "p3t3", 4, 2);
  votes(reactions, "p4t1", 5, 0);
  votes(reactions, "p4t2", 4, 1);

  return {
    posts: [
      {
        id: "p1",
        slug: "the-election-that-changes-your-week",
        title: "The election that actually changes your week",
        excerpt:
          "National races get the billboards. The lines under them decide the bus, the rent board, and whether the library is open on Sunday.",
        tags: ["Local politics", "Voting"],
        createdAt: "2026-11-06T15:00:00.000Z",
        updatedAt: "2026-11-06T15:00:00.000Z",
        status: "published",
        sources: [],
        takes: [
          {
            id: "p1t1",
            text: "Local offices shape daily life more than most national headlines do.",
          },
          {
            id: "p1t2",
            text: "The short ballot at the bottom of the ticket deserves the same attention as the top.",
          },
        ],
        body: `National races get the billboards, the arguments at dinner, and almost all of the anxiety. Under those lines on the ballot is a second election that most people treat as homework: commissioners, clerks, school boards, bond measures, judges who will still be in office when the presidential signs come down.

That second election is the one that changes an ordinary week. It decides whether the bus you catch still runs after 8 p.m., whether a rent board has anyone on it who has rented in the last decade, whether the library is open on Sundays, and which roads get plowed first. None of that trends. All of it is politics.

I am not arguing that federal power is small. Wars, courts, and the tax code reach into a kitchen. I am arguing that attention is badly rationed. We rehearse national arguments we cannot personally settle, then leave blank the boxes we actually have a chance of swinging. A local race can turn on a few hundred votes. You can meet the candidates in a room that does not require a donation to enter.

## A way to read the bottom of the ballot

There is a practical way to take those lines seriously without turning into a full-time staffer.

1. Learn the offices, not just the names. A clerk who runs elections is not a mascot. A comptroller who cannot explain a budget should not get a pass because their party label matches your jacket.
2. Read one primary source before you read a mailer. The budget summary, the meeting minutes, the text of the bond. Mailers are ads.
3. Ask what the office can legally do. A surprising amount of local campaigning promises outcomes that sit in some other jurisdiction. The honest candidate can point to the lever they actually hold.

The objection I hear is time. Fair. A national campaign is designed to find you. A zoning board is not. That is exactly why a little deliberate time beats a lot of ambient opinion. Twenty minutes with a voter guide is not civic romanticism. It is how you stop outsourcing your street to whoever organized last.

If you disagree, say which national lever you think dwarfs the local ones where you live, and name the office. I would rather argue about a real lever than a slogan.`,
      },
      {
        id: "p2",
        slug: "how-to-read-a-poll",
        title: "How to read a poll without borrowing its confidence",
        excerpt:
          "A poll is a photograph of a moving crowd, taken with a shaky camera. Treat the margin of error as part of the sentence, not a footnote.",
        tags: ["Media", "Polls"],
        createdAt: "2026-11-02T15:00:00.000Z",
        updatedAt: "2026-11-02T15:00:00.000Z",
        status: "published",
        sources: [],
        takes: [
          { id: "p2t1", text: "A single poll is a noisy snapshot, not a verdict." },
          {
            id: "p2t2",
            text: "The margin of error belongs in the claim, not the footnote.",
          },
          {
            id: "p2t3",
            text: "If the question text is hidden, the headline is incomplete.",
          },
        ],
        body: `A poll is a photograph of a moving crowd, taken with a camera that cannot quite hold still. By the time it reaches your feed, someone has cropped it into a verdict. Voters want this. The race is over. The photograph was never that steady.

Start with the sentence the pollster is actually allowed to say. They talked to a sample. The sample has a size. The result has a margin of error, and that margin is not a footnote for specialists. It is part of the claim. A candidate "up two" inside a margin of three is not up. They are inside the blur.

Then ask who was in the room. Registered voters, likely voters, and adults are different crowds. "Likely" is a model, not a fact, and models of turnout are where a poll quietly smuggles an argument about who will bother to show up. If you do not know which crowd was surveyed, you do not have a finding yet. You have a headline.

## Read the question, not the summary

Wording is a choice. "Do you support the plan?" is not the same instrument as a description of the plan written by people who hate it. A serious write-up links the question text. A clip that will not show the question is asking you to borrow its confidence for free.

The [American Association for Public Opinion Research](https://www.aapor.org) has spent years saying, in plainer language than most campaigns prefer, that a good survey tells you how it was built. That standard is not partisan. It is how you keep a number from being used as a costume.

None of this means polls are fake. Good polls are one of the few tools we have for hearing from people who will never call into a show. The discipline is to keep the tool in its job. A poll can tell you that a message is landing, or that a race is close. It cannot tell you that your argument is finished, and it cannot see next Tuesday's weather, scandal, or court ruling.

When I cite a number here, I want to cite the sample, the dates, and the thing the number cannot prove. If I fail at that, the comment section is the right place to say so.`,
      },
      {
        id: "p3",
        slug: "disagree-in-public",
        title: "Disagree in public, or the argument moves without you",
        excerpt:
          "Private irritation does not correct a public claim. If an argument matters, it has to survive contact with the people who reject it.",
        tags: ["Discourse"],
        createdAt: "2026-10-26T15:00:00.000Z",
        updatedAt: "2026-10-26T15:00:00.000Z",
        status: "published",
        sources: [],
        takes: [
          {
            id: "p3t1",
            text: "Public disagreement is how a political argument gets tested.",
          },
          { id: "p3t2", text: "Contempt is not a counterargument." },
          {
            id: "p3t3",
            text: "A take should be short enough to accept or reject.",
          },
        ],
        body: `There is a style of politics that treats disagreement as a mess someone else should clean up. You read a claim, feel the error in it, and take the feeling somewhere private: a group chat, a sigh, a block button. The original claim stays standing in public, unbothered, collecting the people who never saw a counterpoint.

I want this blog to work the other way. A take should be short enough to reject. If you think I am wrong, say so under the take, with your name or without a costume. Agreement is useful too. It tells me which arguments are earning their place, and which ones I am only repeating because they sound like me.

## The standard under the essay

Public disagreement is not an invitation to be cruel. Contempt is not a counterargument. It ends the only process that could have changed a mind, including mine. The standard I am asking for is ordinary and strict.

- Quote the claim you mean.
- Say what would make it false.
- Bring one fact another person can check.

There is a cost to arguing in the open. You might lose. You might learn that the line you liked was doing less work than the applause suggested. That cost is the point. An argument that cannot survive a skeptical reader is not an argument you should be passing on to anyone else.

I will get specific things wrong. The useful response is a better sentence, not a verdict on my motives. Motives are a guess. Sentences can be checked.

> If a take cannot survive a comment, it should not survive the next draft.

That is the house rule. The buttons under each post are there so a stance is easy. The comment box is there because most real disagreements do not fit inside a button.`,
      },
      {
        id: "p4",
        slug: "bring-a-number",
        title: "Bring a number, then say what it cannot prove",
        excerpt:
          "A figure in a political argument still needs a source, a year, and a limit. The limit is how a reader knows you read it.",
        tags: ["Evidence"],
        createdAt: "2026-10-18T15:00:00.000Z",
        updatedAt: "2026-10-18T15:00:00.000Z",
        status: "published",
        sources: [],
        takes: [
          {
            id: "p4t1",
            text: "A statistic still needs a source, a year, and a limit.",
          },
          {
            id: "p4t2",
            text: "An anecdote shows that something is possible, not that it is typical.",
          },
        ],
        body: `Political writing loves a number the way a speech loves a pause. It sounds like contact with the world. Sometimes it is. Sometimes the number was chosen because it was available, and the sentence around it was written afterward.

Here is the rule I am setting for myself. If I use a figure, I say where it came from, what year it covers, and the decision it does not settle. A city can spend more on one department than another and still have a separate argument about staffing, results, and what each budget was asked to do. The ratio is a clue. It is not a closing statement.

## Stories are numbers with a sample of one

The same rule applies to anecdotes. A story can show that something is possible. It cannot show that it is typical. When I tell a story, I owe you a reason to think it is more than my favorite example: a count, a comparison, a record someone else can open.

This is a writing rule before it is a policy position. It slows me down, which is the advantage. Speed is how a bad claim outruns its correction. A blog is allowed to be fast. It is also allowed to show its work.

If you have a number that complicates one of these posts, bring it. Include the source. Then say what you think it cannot prove. That last part is how I can tell you actually read it, and it is the part I will hold myself to when I cite anything here.`,
      },
    ],
    comments: [
      {
        id: "c1",
        postId: "p1",
        takeId: "p1t1",
        authorName: "Mara",
        body: "The library hours example is the one that stuck. I vote in every November election and I still could not name my county clerk last year.",
        createdAt: "2026-11-06T18:30:00.000Z",
        visitorId: "seed-mara",
      },
      {
        id: "c2",
        postId: "p1",
        takeId: "p1t1",
        authorName: "Andre",
        body: "National policy still sets the budget local offices have to live inside. I agree the bottom of the ballot is neglected. I do not agree that it outweighs the top.",
        createdAt: "2026-11-07T02:10:00.000Z",
        visitorId: "seed-andre",
      },
      {
        id: "c3",
        postId: "p2",
        takeId: "p2t2",
        authorName: "Priya",
        body: "I would add the field dates next to the margin. A three-day-old poll and a three-week-old poll can share a number and not share a world.",
        createdAt: "2026-11-02T21:05:00.000Z",
        visitorId: "seed-priya",
      },
      {
        id: "c4",
        postId: "p3",
        takeId: "p3t2",
        authorName: "Jonah",
        body: "Agreed that contempt ends the argument. I still think some claims are made in bad faith, and a reader should be allowed to say that without pretending it is the whole rebuttal.",
        createdAt: "2026-10-27T14:20:00.000Z",
        visitorId: "seed-jonah",
      },
    ],
    reactions,
  };
}
