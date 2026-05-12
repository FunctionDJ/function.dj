---
title: "Prevent infinite recursion in typescript-eslint"
description: "Here's how you can fix ESLint from blowing the stack when you use circular types and typescript-eslint."
pubDate: "12.05.2026"
draft: false
---

## Read-only everything

I'm always looking for ways to make my rules and code stricter and I came across `typescript-eslint`'s [`prefer-readonly-parameter-types`](https://typescript-eslint.io/rules/prefer-readonly-parameter-types/) rule. My current project happens to use a lot of OOP with many related and nested classes, so first I tried wrapping parameters and class fields in TypeScript's built-in `Readonly<>` type, but this isn't recursive and so most places where I tried this still violated the newly added ESLint rule. Next I found a recursive `ReadonlyDeep` type in `prisma` which I prompty adopted into my main code.

It looks something like this:

```ts
type ReadonlyDeep<T> = T extends object
	? { readonly [Key in keyof T]: ReadonlyDeep<T[Key]> } // <-- this is called a "mapped type"
	: T;
```

Read more about mapped types here: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers

## Methods broke

Turns out, if you "blindly" make a class type recursively read-only, you can't call methods on it anymore. I've made a small adjustment to filter out functions (which includes methods) because `prefer-readonly-parameter-types` conveniently has an [option](https://typescript-eslint.io/rules/prefer-readonly-parameter-types/#treatmethodsasreadonly) to accept non-read-only methods (because I don't know how I could use a recursive read-only wrapper _and_ keep methods callable).

Here's how my version looked like which keeps methods callable:

```ts
type ReadonlyDeep<T> = T extends Function
	? T
	: T extends object
		? { readonly [Key in keyof T]: ReadonlyDeep<T[Key]> }
		: T;
```

By the way, if you're also thinking "if my methods aren't read-only now, how can I ban code that tries to assign something to them?" - I've asked myself the same and came up with this [`no-restricted-syntax`](https://eslint.org/docs/latest/rules/no-restricted-imports) configuration:

```js
export default defineConfig([
	{
		// ...
		rules: {
			"no-restricted-syntax": [
				"error",
				{
					selector:
						"AssignmentExpression[left.type='MemberExpression'][right.type='FunctionExpression'], AssignmentExpression[left.type='MemberExpression'][right.type='ArrowFunctionExpression']",
					message: "Do not reassign methods/functions on object properties.",
				},
			],
		},
	},
]);
```

I don't remember the details but I'm pretty sure I've checked if TypeScript and my existing, subjectively very strict ESLint config already prevent assigning values to methods without an additional rule, and I'm pretty sure it is possible. What I'm trying to say is: This `no-restricted-syntax` rule _can_ actually catch code that you probably don't want to allow that isn't caught by any other mechanism.

## Infinite recursion aaaaaah

Unfortunately there was something wrong with these rules and the `ReadonlyDeep` type helper in combination with my project.
ESLint / Node would consistently crash. When run via the CLI, it looked something like this:

```plain
RangeError: Maximum call stack size exceeded
Occurred while linting /home/function/git/my-project/file.ts:16
Rule: "@typescript-eslint/prefer-readonly-parameter-types"
    at getMappedType (/home/function/git/my-project/node_modules/typescript/lib/typescript.js:67962:25)
// ...
```

At the time I didn't know that this was necessarily an infinite recursion problem. I tend to believe that infinite recursion issues are often solved upstream by smarter developers, but I was ignorant about this being a case where _I_ introduced the infinite recursion and it's just not possible for TypeScript or `typescript-eslint` to protect my from myself in this case and solve the issue for me.

To narrow down the problem I did what I'm currently doing surprisingly often to troubleshoot tooling issues I'm running into:

1. `cp -R . ../repro-[name-of-whatever-broke] && code ../repro-[name-of-whatever-broke]`
2. Delete files and lines of code, simplify it, and copy imported code into the current file until the problem goes away (and then go one step back) to filter everything down to a minimal-reproduction.
   - In this case, I used `npx nodemon --watch src --ext ts --exec 'eslint file.ts'` to iterate quickly
   - In the `repro-[...]` project one of the first things I did was strip down `eslint.config.js` completely down to _just_ the `prefer-readonly-parameter-types` rule + required config for `typescript-eslint` like `projectService: true` to massively speed up ESLint to either crash or process much quicker
3. Use git commits, staging etc. frequently to be able to roll back a change that made the problem go away

After playing this game for a while, I ended up with this single file that didn't have any imports anymore and that still caused the call stack error:

```ts
type ReadonlyDeep<T> = T extends object
	? // i removed the conditional type
		// that checks for `Function` because it wasn't needed here
		{ readonly [Key in keyof T]: ReadonlyDeep<T[Key]> }
	: T;

interface Foo {
	bar: ReadonlyDeep<Bar>;
}

interface Bar {
	foo: Foo;
}

function fn(item: ReadonlyDeep<Bar>): void {}
```

So in my original project I had two classes that (intentionally) reference each other. I converted these to minimal interfaces because I feel like if the problem is unrelated to classes, it's better to use interfaces for e.g. a GitHub issue or something (if it ever came to that). The `fn` function used to be a method on a third class, but I just tried to move it outside that class to be a simple function and the error still occurred, so I was able to remove that third class from the code.

Let's hover over the `item` parameter of `fn`:

```ts
(parameter) item: {
    readonly foo: {
        readonly bar: {
            readonly foo: {
                readonly bar: {
                    readonly foo: {
                        readonly bar: {
                            readonly foo: {
                                readonly bar: {
                                    readonly foo: {
                                        readonly bar: {
                                            readonly foo: ...;
																				// ...
```

_Weeeeeeeeeeeeeeeeeeeeee_ yeah, I see the problem now.

What can we do about it? I simply had an idea: In `ReadonlyDeep`, before "returning" `ReadonlyDeep<T[Key]>`, I'll just check if `T[Key]` already extends `ReadonlyDeep<T[Key]>` and only "wrap" it again if it doesn't.

This is how it looks now (still missing the `Function` conditional that I added back for the actual project):

```ts
type ReadonlyDeep<T> = T extends object
	? {
			readonly [P in keyof T]: T[P] extends ReadonlyDeep<T[P]>
				? T[P]
				: ReadonlyDeep<T[P]>;
		}
	: T;
```

And... it works! But why? I guess it _kind of_ makes sense to prevent the recursion in _some_ way, but then again, don't TS / ESLint need to resolve the condition first (`extends ReadonlyDeep<T[P]> ?`) before branching? When I wrote this modification, I was concerned that this would still blow the stack because of that reason, but it doesn't. Maybe TS is now able to close the circular types together like it can do when we just have simple interfaces or classes that reference each other. I'm sorry that I can't properly answer this - it's above my pay grade of 0€ for this project.

Not much else to say. Did you like this article? Send me a message on any of my socials :)
