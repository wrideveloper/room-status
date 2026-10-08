// Chrome DevTools automatically requests this path; respond 204 so it does not
// surface as an unmatched-route 404 in the dev server logs.
export function loader() {
	return new Response(null, { status: 204 });
}
