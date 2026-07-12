const tsv = `type	front	back	options	correctOption	clozeTemplate	whyPrompt	tags	subtopicSlug	tier	advancedMetadata
flashcard	Write the standard Cartesian Equation of Trajectory for a ground-to-ground projectile (relating $y$ and $x$ in terms of $u$ and $\\theta$).	$y = x\\tan\\theta - \\frac{gx^2}{2u^2\\cos^2\\theta}$	[EMPTY]	[EMPTY]	[EMPTY]	[EMPTY]	trajectory-equation, standard-form	slug	free	[EMPTY]
flashcard	Write the highly optimized Equation of Trajectory formatted directly in terms of the Horizontal Range ($R$).	$y = x\\tan\\theta \\left(1 - \\frac{x}{R}\\right)$	[EMPTY]	[EMPTY]	[EMPTY]	[EMPTY]	trajectory-equation, range-form	slug	free	[EMPTY]
assertion_reason	Assertion: The equation of trajectory for a projectile completely lacks the time variable ($t$).\\nReason: The trajectory equation describes the physical geometric path of the particle in 2D space, which is found by mathematically eliminating time between the $x(t)$ and $y(t)$ equations.	[EMPTY]	[EMPTY]	[EMPTY]	[EMPTY]	[EMPTY]	trajectory-concept, time-elimination	slug	free	{"assertion": "The equation of trajectory for a projectile completely lacks the time variable (t).", "reason": "The trajectory equation describes the geometric path in space, derived by eliminating time from the x and y parametric equations.", "correctAssertionReasonKey": "A"}
mcq	Two guns A and B fire bullets in all possible directions on horizontal ground with speeds of $1$ km/s and $2$ km/s respectively. What is the ratio of the maximum geometric areas covered by the bullets from the two guns ($Area_A : Area_B$)?	[EMPTY]	1:4 | 1:8 | 1:16 | 1:2	2	[EMPTY]	[EMPTY]	trajectory-concept, time-elimination	slug	free	{"justification": "Area is proportional to the square of the maximum range (Area = pi * R_max^2). Since R_max is proportional to u^2, Area is proportional to (u^2)^2 = u^4. The ratio is 1^4 : 2^4 = 1:16."}
matrix_match	Match the projectile parameter to its proportionality dependence on the initial launch speed $u$ (assuming a fixed angle).	[EMPTY]	[EMPTY]	[EMPTY]	[EMPTY]	[EMPTY]	proportionality, kinematics	slug	free	{"matrixA": ["Time of Flight (T)", "Maximum Height (H)", "Horizontal Range (R)", "Maximum Area Covered"], "matrixB": ["Proportional to u", "Proportional to u squared", "Proportional to u squared", "Proportional to u to the power of 4"], "matrixMapping": {"0": [0], "1": [1], "2": [2], "3": [3]}}`;

const lines = tsv.trim().split(/\r?\n/).filter(Boolean);
const header = lines[0].split("\t");
console.log("Header columns:", header.length);

lines.slice(1).forEach((line, index) => {
  const cells = line.split("\t");
  console.log(`Line ${index + 1} (${cells[0]}): columns=${cells.length}`);
  cells.forEach((cell, i) => {
    console.log(`  col ${i} (${header[i] || 'unknown'}): ${cell.slice(0, 50)}`);
  });
});
