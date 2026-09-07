# Model photos

One photo per datasheet, named after the unit id in `data/units.json`:
`belakor.jpg`, `lord_of_change.jpg`, `pink_horrors.png`, and so on (jpg, png
or webp). Keep them around 1,000 px on the long edge; the deck shows them at
250 px wide on a desktop and full width on a phone.

Two ways in:

- Drop the file here and run `python3 build_datasheets.py`. The book links it
  and the deck shows it.
- On the published deck, tap **Add photo** on a unit slide, pick or take a
  picture, and press **Save photos**. The page shrinks the image and stores
  it inside itself. To bring those back here, save the published page as
  HTML and run `python3 build_datasheets.py --import-photos saved.html`.

Photos are your own; nothing here is a Games Workshop image.
