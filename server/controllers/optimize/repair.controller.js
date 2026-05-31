'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * Rebuilds the cross-reference (XREF) table of a corrupted PDF buffer 
 * by scanning raw object offsets directly.
 */
function rebuildXref(buffer) {
  let pdfStr = buffer.toString('binary');

  // Repair any missing /Length keys in stream objects
  const objRegex1 = /(\d+)\s+(\d+)\s+obj/g;
  let match1;
  const objects1 = [];
  while ((match1 = objRegex1.exec(pdfStr)) !== null) {
    objects1.push({
      id: parseInt(match1[1], 10),
      gen: parseInt(match1[2], 10),
      offset: match1.index
    });
  }

  let modifiedPdfStr = pdfStr;
  if (objects1.length > 0) {
    const sortedObjsDesc = [...objects1].sort((a, b) => b.offset - a.offset);
    for (const obj of sortedObjsDesc) {
      const endObjIdx = modifiedPdfStr.indexOf('endobj', obj.offset);
      if (endObjIdx === -1) continue;
      
      const objContent = modifiedPdfStr.substring(obj.offset, endObjIdx);
      const streamIdx = objContent.indexOf('stream');
      if (streamIdx === -1) continue; // Not a stream object
      
      const dictPart = objContent.substring(0, streamIdx);
      if (dictPart.includes('/Length')) continue; // Already has length
      
      const endstreamIdx = objContent.indexOf('endstream');
      if (endstreamIdx === -1) continue;
      
      // Calculate length of bytes between stream and endstream
      let startBytesIdx = streamIdx + 6;
      if (objContent.substring(startBytesIdx, startBytesIdx + 2) === '\r\n') {
        startBytesIdx += 2;
      } else if (objContent.substring(startBytesIdx, startBytesIdx + 1) === '\n') {
        startBytesIdx += 1;
      }
      
      let endBytesIdx = endstreamIdx;
      if (objContent.substring(endBytesIdx - 2, endBytesIdx) === '\r\n') {
        endBytesIdx -= 2;
      } else if (objContent.substring(endBytesIdx - 1, endBytesIdx) === '\n') {
        endBytesIdx -= 1;
      }
      
      const streamLength = Math.max(0, endBytesIdx - startBytesIdx);
      const dictEndIdx = dictPart.lastIndexOf('>>');
      if (dictEndIdx === -1) continue;
      
      const newDictPart = dictPart.substring(0, dictEndIdx) + `\r\n/Length ${streamLength}\r\n` + dictPart.substring(dictEndIdx);
      let newObjContent = newDictPart + objContent.substring(streamIdx);
      
      // Whitespace preservation: Ensure the final length matches the original EXACTLY
      const originalLength = objContent.length;
      let diff = newObjContent.length - originalLength;
      
      if (diff > 0) {
        // Shrink by replacing \r\n with \n or removing multiple spaces
        while (diff > 0 && newObjContent.includes('\r\n')) {
          newObjContent = newObjContent.replace('\r\n', '\n');
          diff--;
        }
        while (diff > 0 && /  /.test(newObjContent)) {
          newObjContent = newObjContent.replace('  ', ' ');
          diff--;
        }
        while (diff > 0 && / \//.test(newObjContent)) {
          newObjContent = newObjContent.replace(' /', '/');
          diff--;
        }
      }
      
      diff = newObjContent.length - originalLength;
      if (diff < 0) {
        // Pad with spaces before '>>' to match original size perfectly
        const padSize = Math.abs(diff);
        const padding = ' '.repeat(padSize);
        newObjContent = newObjContent.replace('>>', padding + '>>');
      }
      
      modifiedPdfStr = modifiedPdfStr.substring(0, obj.offset) + newObjContent + modifiedPdfStr.substring(endObjIdx);
    }
  }

  return Buffer.from(modifiedPdfStr, 'binary');
}

/**
 * POST /api/v1/pdf/optimize/repair
 * Body: file (PDF — possibly corrupted)
 * Strategy: Rebuild raw XREF offsets, load, and re-serialize to clean.
 * Returns: Repaired PDF
 */
async function repairPdf(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    // Write to disk for structural debugging
    const fs = require('fs');
    fs.writeFileSync('d:\\PDF EDITER WEBSITE\\temp_debug.pdf', req.file.buffer);

    // Apply the custom binary XREF repair rebuilder first
    const repairedInputBuffer = rebuildXref(req.file.buffer);

    let doc;
    try {
      doc = await PDFDocument.load(repairedInputBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false,
        capnp: false,
      });
    } catch (loadErr) {
      throw createError(
        `Could not parse PDF structure: ${loadErr.message}. The file may be severely corrupted.`,
        422,
      );
    }

    if (!doc.catalog) {
      throw createError(
        'The PDF catalog is missing or severely corrupted and cannot be repaired.',
        422,
      );
    }

    // Re-serializing rebuilds the XREF table and cleans object streams
    let repairedBytes;
    try {
      repairedBytes = await doc.save({ useObjectStreams: true });
    } catch (saveErr) {
      throw createError(
        `Could not save repaired PDF structure: ${saveErr.message}. The file is severely corrupted.`,
        422,
      );
    }
    const repairedBuffer = Buffer.from(repairedBytes);

    let pageCount = '0';
    try {
      pageCount = String(doc.getPageCount());
    } catch (e) {
      // Gracefully fall back to '0' page count if the PDF structure is broken
    }

    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="repaired.pdf"')
      .set('X-Page-Count', pageCount)
      .set('X-Processing-Time', `${Date.now() - startTime}ms`)
      .send(repairedBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { repairPdf };
