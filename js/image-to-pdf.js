// Image to PDF Logic
// Uses jsPDF and SortableJS

let images = [];
const dropZone = document.querySelector('.drop-zone');
const fileInput = document.getElementById('fileInput');
const workspace = document.getElementById('workspace');
const imageGrid = document.getElementById('imageGrid');
const convertBtn = document.getElementById('convertBtn');
const statusMsg = document.getElementById('statusMsg');

document.addEventListener('DOMContentLoaded', () => {
    // Setup Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());

    // Sortable
    new Sortable(imageGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: updateImageOrder
    });

    // File Input
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
});

function handleFiles(fileList) {
    const newFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'));

    if (newFiles.length === 0) {
        showToast('Please select valid image files.', 'error');
        return;
    }

    // Read and add images
    let loadedCount = 0;
    newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgObj = {
                id: Date.now() + Math.random(),
                data: e.target.result,
                name: file.name,
                file: file
            };
            images.push(imgObj);
            loadedCount++;

            if (loadedCount === newFiles.length) {
                renderGrid();
            }
        };
        reader.readAsDataURL(file);
    });
}

function renderGrid() {
    imageGrid.innerHTML = '';

    if (images.length > 0) {
        workspace.classList.remove('hidden');
        dropZone.classList.add('hidden'); // Hide drop zone when working? Or keep it?
        // Let's keep dropzone accessible? No, design shows separate workspace. 
        // We can add a "Add more" button later, but for now simple flow.
    } else {
        workspace.classList.add('hidden');
        dropZone.classList.remove('hidden');
    }

    images.forEach(img => {
        const item = document.createElement('div');
        item.className = 'image-item';
        item.dataset.id = img.id;
        item.innerHTML = `
            <img src="${img.data}" alt="${img.name}">
            <button class="remove-btn" onclick="removeImage('${img.id}')"><i class="fas fa-times"></i></button>
        `;
        imageGrid.appendChild(item);
    });
}

function removeImage(id) {
    images = images.filter(img => img.id != id);
    renderGrid();
}

function updateImageOrder() {
    // Re-order array based on DOM
    const newOrder = [];
    const items = imageGrid.querySelectorAll('.image-item');
    items.forEach(item => {
        const id = item.dataset.id;
        const img = images.find(i => i.id == id);
        if (img) newOrder.push(img);
    });
    images = newOrder;
}

async function convertToPDF() {
    if (images.length === 0) return;

    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
    statusMsg.textContent = 'Generating PDF...';

    // Ensure order is correct
    updateImageOrder();

    const pageSize = document.getElementById('pageSize').value;
    const orientation = document.getElementById('orientation').value;

    const { jsPDF } = window.jspdf;

    try {
        // Create PDF with first page settings
        // Note: We'll adjust page size per page if 'original' is selected, 
        // or strictly follow A4 if 'a4' is selected.

        let doc;
        if (pageSize === 'a4') {
            doc = new jsPDF({
                orientation: orientation === 'auto' ? 'p' : orientation,
                format: 'a4'
            });
        } else {
            doc = new jsPDF(); // Default, will change
        }

        // Remove default first page
        doc.deletePage(1);

        for (const img of images) {
            const imgProps = await getImageProperties(img.data);

            let pdfWidth, pdfHeight;
            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;
            let finalOrientation = orientation;

            if (orientation === 'auto') {
                finalOrientation = imgWidth > imgHeight ? 'l' : 'p';
            }

            if (pageSize === 'a4') {
                const a4Width = finalOrientation === 'p' ? 210 : 297;
                const a4Height = finalOrientation === 'p' ? 297 : 210;

                // Add page
                doc.addPage('a4', finalOrientation);

                // Calculate fit
                const ratio = Math.min(a4Width / imgWidth, a4Height / imgHeight);
                const finalW = imgWidth * ratio;
                const finalH = imgHeight * ratio;

                // Center image
                const x = (a4Width - finalW) / 2;
                const y = (a4Height - finalH) / 2;

                doc.addImage(img.data, 'JPEG', x, y, finalW, finalH);

            } else {
                // Original size (px to mm approx conversion for PDF)
                // jsPDF default unit is mm. 1px = 0.264583 mm
                const pxToMm = 0.264583;
                pdfWidth = imgWidth * pxToMm;
                pdfHeight = imgHeight * pxToMm;

                doc.addPage([pdfWidth, pdfHeight], pdfWidth > pdfHeight ? 'l' : 'p');
                doc.addImage(img.data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }
        }

        doc.save("images_converted.pdf");

        showToast('PDF Created Successfully!');
        if (window.playSound) window.playSound('success');

    } catch (error) {
        console.error("PDF Gen Error:", error);
        showToast('Error generating PDF.', 'error');
    } finally {
        convertBtn.disabled = false;
        convertBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Convert to PDF';
        statusMsg.textContent = '';
    }
}

function getImageProperties(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
    });
}

function showToast(msg, type = 'success') {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        alert(msg);
    }
}
