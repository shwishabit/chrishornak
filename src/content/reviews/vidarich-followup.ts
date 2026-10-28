import type { ReviewContent } from './types'

/* Follow-up to Rich's design review (finalized 2026-10-28). Takeaways come from his
 * notes, key by key, in Projects/vidarich/reference/rich-review-2026-10-28.json. */
export const vidarichFollowup: ReviewContent = {
  slug: 'vidarich-followup',
  title: 'VidaRich: before we build',
  client: 'Rich Calandra, VidaRich',
  intro:
    'Thanks for the review, Rich. Here is what we took from your notes, plus a few questions so we build the right thing. It saves as you go. Send it when you’re done. Blanks are fine.',
  assets: '/review/vidarich/',
  options: [],
  followup: {
    takeaways: [
      {
        key: 'T1',
        title: 'Option A is the one',
        heard: 'You like Option A best, with the icon boxes from Option B for how to mix it.',
        plan: 'We build the new site on Option A, home page and order page.',
      },
      {
        key: 'T2',
        title: 'Colors: green, or the jar’s brown and gold',
        heard: 'You’d like to see Option A in the brown and gold of the jar, next to the green, before you decide. If it goes brown, the footer gets gold lettering on brown.',
        plan: 'We make a brown and gold version of Option A so you can compare the two side by side. Then you pick.',
      },
      {
        key: 'T3',
        title: 'Top of the page',
        heard: 'Show the jar in the opening image. Headline: “Your Daily Routine, Upgraded.” A banner for “over 200,000 servings sold.” More color in the logo so it pops.',
        plan: 'A new opening photo with the jar, your headline, and the servings banner in the open space.',
      },
      {
        key: 'T4',
        title: 'Ingredients',
        heard: 'Collagen first, in its own section, with a short note on why it works with the superfoods. Then 6 ingredients, each with a photo: lion’s mane, cordyceps, cacao, spirulina, beet root and MCT oil. Keep the dose in the corner. The spirulina photo looks empty.',
        plan: 'A collagen section, then 6 ingredient tiles in that order. A new spirulina photo, from your current site if we don’t find a better one.',
      },
      {
        key: 'T5',
        title: 'Your drink, with and without',
        heard: 'Blend the with/without table and the mug picture from Option B into one section. Headline “Your Drink, just Better!” with your copy about coffee, tea, smoothies or water. Labels “Your Drink” and “Your Drink + VidaRich.”',
        plan: 'One section with your words and the side-by-side picture.',
      },
      {
        key: 'T6',
        title: 'Price',
        heard: '“Less than half the price of your local coffee shoppe*”, which can run $4.50 to $7.50.',
        plan: 'Your line, with a footnote for the price range.',
      },
      {
        key: 'T7',
        title: 'How to mix it',
        heard: 'Icon boxes, in the same layout as the ingredients. Short videos could work too. 4 steps: 1. Add the scoop first. 2. Pour in your drink, hot or cold. 3. Stir, blend or froth until creamy smooth. 4. Enjoy!',
        plan: '4 icon boxes in that order, with the same words on the home page and the order page.',
      },
      {
        key: 'T8',
        title: 'Where to buy',
        heard: 'List the stores that truly support you: Soulberry Natural Market, Kimberton Whole Foods and Basil Bandwagon. “Tastings with Rich” links to a list of your shows, demos and farmers’ markets.',
        plan: 'Those 3 stores on the home page, and a link to your events list.',
      },
      {
        key: 'T9',
        title: 'Closing section',
        heard: 'It opens with “This Sh!t Works…” and the 30-day promise.',
        plan: 'Your line and the 30-day money-back promise. Your note cut off, so there is a question about it below.',
      },
      {
        key: 'T10',
        title: 'Order page',
        heard: 'The buy box is what you want. Line: “Collagen, organic mushrooms and superfoods for your morning coffee or daily drink of choice. 30 servings a jar.” Options: 1 jar (30 servings) a month, 2-pak (60 servings) a month, 4-pak (120 servings). Ingredients in this order: collagen, lion’s mane, cordyceps, cacao, spirulina, beet root. A row of the icons from your label. Keep the questions section. You’ll write the questions and answers.',
        plan: 'All of that, in your words.',
      },
    ],
    answers: [
      {
        q: 'Can I change text, photos and reviews after the site is live?',
        a: 'Yes. You change text and photos in the Shopify theme editor, and reviews in Judge.me.',
      },
      {
        q: 'Why doesn’t Option B move on my phone?',
        a: 'The movement plays when a mouse moves over a section. Phones have no mouse, so it stays still. There is a question about movement on phones below.',
      },
    ],
    groups: [
      {
        title: 'Before we build',
        intro: 'These change what we build first.',
        questions: [
          { key: 'Q1', q: 'Your closing note cut off at “Try it for 30 days and if Vidarich…”. How should it end?' },
          { key: 'Q2', q: 'Where does “over 200,000 servings sold” come from, and is it current?', why: 'A big number gets questions. We want to be able to back it up.' },
          {
            key: 'Q3',
            q: 'The coffee shop price ($4.50 to $7.50) needs a footnote. Do you have a source?',
            choices: ['I’ll send a source', 'Use a published average price'],
          },
          {
            key: 'Q4',
            q: 'The FDA registers facilities but doesn’t approve them. Can we say “Made in an FDA-registered facility”?',
            choices: ['Yes', 'Let’s talk'],
          },
          { key: 'Q5', q: 'Who does the third-party testing?', why: 'A lab name or a report lets us show it with confidence.' },
          {
            key: 'Q6',
            q: 'The label lists MCT oil in the creamer, with no amount. The other tiles show a dose. How should we show MCT?',
            choices: ['Show it with no amount', 'Leave MCT out of the tiles'],
          },
          { key: 'Q7', q: 'The short collagen note: will you write it, or should we draft it for you to approve?', choices: ['I’ll write it', 'You draft it'] },
          { key: 'Q8', q: 'Is the 4-pak a monthly plan too, like the other two? And is “pak” the spelling you want?' },
          { key: 'Q9', q: 'You marked the footer “don’t like”. What would you change?' },
        ],
      },
      {
        title: 'These can wait',
        intro: 'Answer now if you know, or skip.',
        questions: [
          { key: 'Q10', q: '“More color in the logo”: which part?', choices: ['The cup', 'The word VidaRich', 'Both'] },
          { key: 'Q11', q: 'How to mix it: do you have short clips of the scoop, pour and stir?', choices: ['I have clips', 'Start with icons'] },
          { key: 'Q12', q: 'Should the store finder page list every store, with these 3 on the home page?', choices: ['Yes, every store', 'Only these 3'] },
          { key: 'Q13', q: 'Want gentle movement on phones too, as you scroll?', choices: ['Yes', 'No, keep it still'] },
          { key: 'Q14', q: 'Your 30-day promise: is it still a full refund, like the card in stores says?', choices: ['Yes, full refund', 'It has changed'] },
        ],
      },
    ],
  },
  fineprint: '',
}
