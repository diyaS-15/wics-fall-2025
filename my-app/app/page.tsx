// how we link to pages - this is something that is built into next.js 
import Link from "next/link"; 
// importing our pixelated font --> use "font-jersey" in tailwindCSS to use the font 
import { Jersey_10 } from "next/font/google";

export default function Home() {
  return (
    // m-10 refers to margin of 10 pixels, so this means that there's 10px of space around this entire div object 
    // the main div object contains all of our code, so anything visible on our app will have that space on the outside 

    <div className="m-10 font-jersey">

      {/* notice how the commenting style changed here -> whenever we work inside of our elements like div/ 
      things that are going to appear on our screen we comment in this way */}

      {/* h1 is our main header element. An element has 2 components to it usually: the start <> and the end </>
      ex: <h1> ... </h1>
      inside the starting element is our styling with TailwindCSS (easier way to style in my opinion)
      For styling, write className="..." with ... being the content using the TailwindCSS documentation reference */}

      {/* !!! ------- PLAY AROUND WITH THE STYLING HERE & CUSTOMIZE IT ---------- !!! */}
      <h1 className="text-5xl text-center">Hello This is Our Homepage!</h1>

      {/* grid is a layout system in CSS, the purpose here is to have 2 games per row */}
      <div className="grid grid-cols-2 gap-4 my-10">
        <div className="p-10 border text-center">

          {/* Link element used to link to another page inside the application. 
          Notice in the app folder, there is a subfolder called game1, which has it's own page.tsx 
          In our main app folder, page.tsx is what we see when first open application - this is at the root (/)

          Since we want to naivgate to a different page (ex: /game1), we would create a new folder with that name, 
          which has it's own page.tsx similar to the one at root (which is what we're on right now) 

          After setting up the subfolder, to link our current page.tsx to the other one, we use the Link element. 
          Inside the start of Link element, href directs where to go, the href should be the same name of your subfolder 
          just with a / at the start. */}

          <Link href="/game1">Game1 - Diya Demo. Click on this and it will take you to Game1 page. </Link>
        </div>
        <div className="p-10 border text-center">
          {/* !!! ------- CREATE YOUR OWN SUBPAGE HERE + ADD LINK -------- !!!  */}
          <Link href="/game2"> Game2 Here </Link>
        </div>
        <div className="p-10 border text-center">
          {/* !!! ------- CREATE YOUR OWN SUBPAGE HERE + ADD LINK -------- !!!  */}
          <p>Delete this function + add link to new page for your game .</p>
        </div>
        <div className="p-10 border text-center">
          {/* !!! ------- CREATE YOUR OWN SUBPAGE HERE + ADD LINK -------- !!!  */}
          <p>Delete this function + add link to new page for your game .</p>
        </div>
          {/* COPY PASTE THE ABOVE ELEMENTS FOR MORE PAGES */}

      </div>
    </div>
  );
}
