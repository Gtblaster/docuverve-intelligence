# Custom & Standard Fonts

Gotenberg uses LibreOffice to perform high-fidelity document conversions. To ensure that layout structures, line breaks, and paragraphs remain identical to Microsoft Word or Excel, place standard Windows fonts in this folder:

- `Arial.ttf`
- `Calibri.ttf`
- `Times.ttf`
- `Georgia.ttf`

Any `.ttf` or `.otf` files placed in this folder will be mounted into Gotenberg's `/usr/local/share/fonts` folder on container startup and will be automatically recognized by the conversion process.
