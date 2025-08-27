async function fetchUserDetails(id) {
    console.log(`Attempting fetch for user ID: ${id}`);
    try {
        const response = await fetch(`https://www.justserve.org/api/v1/users/${id}`, {
            credentials: 'include'
        });
        console.log(`Response for user ${id}:`, response.status, response.statusText);
        if (response.ok) {
            const json = await response.json();
            console.log(`Parsed JSON for user ${id}:`, json);
            return json;
        }
        return null;
    } catch (e) {
        console.error(`Fetch error for user ${id}:`, e);
        return null;
    }
}

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log("onBeforeRequest triggered for:", details.url, "method:", details.method); // Added very early log
    if (details.method === "POST" && details.url.includes("/api/v1/projects/")) {
        let filter = browser.webRequest.filterResponseData(details.requestId);
        let decoder = new TextDecoder("utf-8");
        let encoder = new TextEncoder();
        let data = "";

        filter.ondata = (event) => {
            data += decoder.decode(event.data, { stream: true });
        };

        filter.onstop = async () => { // Make this async
            filter.write(encoder.encode(data));
            filter.close();

            try {
                const projectData = JSON.parse(data);

                // Get user IDs of project owners
                const ownerIds = projectData.projectOwners
                    .filter(owner => owner.ownerType === 1)
                    .map(owner => owner.id);

                console.log("Fetching details for owner IDs:", ownerIds); // Log owner IDs

                // Fetch user details for each owner using the new function
                const ownerDetailsPromises = ownerIds.map(id => fetchUserDetails(id));

                const ownerDetails = await Promise.all(ownerDetailsPromises);

                // Add owner details to the project data, filtering out any nulls
                projectData.projectOwnerDetails = ownerDetails.filter(d => d !== null);
                console.log("Final projectOwnerDetails sent to content script:", projectData.projectOwnerDetails); // Log final details

                if (details.tabId !== -1) {
                    browser.tabs.sendMessage(details.tabId, {
                        type: "PROJECT_DATA",
                        payload: projectData,
                    });
                }
            } catch (e) {
                console.error("Error processing project data:", e);
            }
        };
    }
  },
  { urls: ["*://*.justserve.org/api/v1/projects/*"] },
  ["blocking"]
);