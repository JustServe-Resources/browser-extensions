browser.runtime.onMessage.addListener((message) => {
  if (message.type === "PROJECT_DATA") {
    const projectData = message.payload;

    // Check if the info box already exists
    let infoContainer = document.getElementById("justserve-extra-info");
    if (infoContainer) {
        // Clear existing content
        infoContainer.innerHTML = '';
    } else {
        // Create the container
        infoContainer = document.createElement("div");
        infoContainer.id = "justserve-extra-info";
        infoContainer.style.position = "fixed";
        infoContainer.style.top = "100px";
        infoContainer.style.right = "20px";
        infoContainer.style.backgroundColor = "var(--fbc-white, #ffffff)";
        infoContainer.style.border = "1px solid rgb(187, 189, 192)";
        infoContainer.style.borderRadius = "12px";
        infoContainer.style.padding = "24px 16px 16px";
        infoContainer.style.zIndex = "10000";
        infoContainer.style.fontFamily = "Noto Sans, sans-serif";
        infoContainer.style.fontSize = "var(--fbc-font-size, 13px)";
        infoContainer.style.color = "var(--fbc-primary-text, #15141A)";
        document.body.appendChild(infoContainer);
    }

    // Determine checkbox color based on listed status
    const isListed = !projectData.isUnlistedProject;
    const checkboxColor = isListed ? 'green' : 'red';

    // Add some styles for the links and checkbox
    const style = document.createElement('style');
    style.textContent = `
        #justserve-extra-info a {
            color: #0081a0;
            text-decoration: none;
        }
        #justserve-extra-info a:hover {
            text-decoration: underline;
        }
        #justserve-extra-info h3 {
            margin-top: 0;
            margin-bottom: 5px;
            font-size: 16px;
            color: var(--fbc-primary-text, #15141A);
        }
        #justserve-extra-info p {
            margin: 0 0 5px 0;
            color: var(--fbc-secondary-text, #5B5B66);
        }
        #justserve-extra-info input[type="checkbox"] {
            accent-color: ${checkboxColor};
        }
    `;
    infoContainer.appendChild(style);


    // Extract the information
    const owners = projectData.projectOwners;
    const submitter = projectData.applicant;
    const createdDate = new Date(projectData.created);

    // Create a map of owner details by ID for easy lookup
    const ownerDetailsById = {};
    if (projectData.projectOwnerDetails) {
        projectData.projectOwnerDetails.forEach(detail => {
            ownerDetailsById[detail.id] = detail;
        });
    }

    // Format the information
    let ownerInfo = "<h3>Project Owners:</h3>";
    owners.forEach(owner => {
        if (owner.ownerType === 1) {
            const ownerDetail = ownerDetailsById[owner.id];
            const ownerName = ownerDetail ? `${ownerDetail.firstName} ${ownerDetail.lastName}` : owner.id;
            ownerInfo += `<p>User: <a href="https://www.justserve.org/admin/users?tab=detail&userId=${owner.id}" target="_blank">${ownerName}</a></p>`;
        } else if (owner.ownerType === 2 && projectData.organization && projectData.organization.url) {
            const orgName = projectData.organization.name || owner.id;
            ownerInfo += `<p>Organization: <a href="https://www.justserve.org/organizations/${projectData.organization.url}" target="_blank">${orgName}</a></p>`;
        } else {
            ownerInfo += `<p>ID: ${owner.id}, Type: ${owner.ownerType}</p>`;
        }
    });

    const submitterInfo = `
      <h3>Project Submitter:</h3>
      <p>Name: ${submitter.firstName} ${submitter.lastName}</p>
      <p>Email: ${submitter.email}</p>
      <p>Phone: ${submitter.phone}</p>
    `;

    const createdInfo = `
      <h3>Project Created:</h3>
      <p>${createdDate.toLocaleString()}</p>
    `;

    // New section for unlisted status with checkbox and tooltip
    let unlistedInfo = '';
    const checkboxChecked = isListed ? 'checked' : '';
    const tooltipText = isListed ? 'This project is publicly listed and will appear in searches.' : 'This project is unlisted and will not appear in public searches.';

    unlistedInfo = `
        <p>
            Project Listed: <input type="checkbox" ${checkboxChecked} disabled title="${tooltipText}">
        </p>
    `;

    // Add the info to the container
    const content = document.createElement('div');
    content.innerHTML = ownerInfo + submitterInfo + createdInfo + unlistedInfo; // Add unlistedInfo here
    infoContainer.appendChild(content);
  }
});