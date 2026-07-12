const { ConvexHttpClient } = require("convex/browser");

async function main() {
  const url = "https://wonderful-orca-329.eu-west-1.convex.cloud";
  const client = new ConvexHttpClient(url);
  
  try {
    const cardId = "j57bgfbxe9r46z19b48wvhfa898ace8q";
    console.log(`Converting card ${cardId} from cloze to flashcard...`);
    
    const newFront = "How is a unit vector (representing direction) algebraically calculated from a vector $\\vec{F}$?";
    const newBack = "A unit vector $\\hat{F}$ is calculated by dividing the vector by its magnitude:\n\n$$\\hat{F} = \\frac{\\vec{F}}{\\vert{}\\vec{F}\\vert{}}$$\n\nWhere:\n- $\\vec{F}$ is the vector\n- $\\vert{}\\vec{F}\\vert{}$ is the magnitude of the vector";
    
    const mutationName = "cards:updateCard";
    await client.mutation(mutationName, {
      id: cardId,
      type: "flashcard",
      front: newFront,
      back: newBack,
      clozeTemplate: "[EMPTY]"
    });
    
    console.log("Successfully updated the card!");
  } catch (err) {
    console.error("Error executing database update script:", err);
  }
}

main();
