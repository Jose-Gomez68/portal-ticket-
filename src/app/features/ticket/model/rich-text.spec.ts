import { sanitizeTicketDescription, ticketDescriptionText } from './rich-text';

describe('ticket rich text', () => {
  it('keeps supported formatting and alignment while removing unsafe markup', () => {
    const description = sanitizeTicketDescription(
      '<p style="text-align: center" onclick="alert(1)"><strong>Importante</strong><img src=x onerror=alert(1)><script>alert(1)</script></p>',
    );

    expect(description).toContain('<p style="text-align: center;"><strong>Importante</strong></p>');
    expect(description).not.toContain('onclick');
    expect(description).not.toContain('<img');
    expect(description).not.toContain('<script');
  });

  it('extracts readable plain text for ticket previews', () => {
    expect(ticketDescriptionText('<ol><li>Primero</li><li>Segundo</li></ol>')).toBe(
      'PrimeroSegundo',
    );
  });

  it('preserves editor indentation without accepting arbitrary style values', () => {
    const description = sanitizeTicketDescription(
      '<p style="margin-inline-start: 3rem; color: red">Con sangría</p><p style="margin-inline-start: 100px">Sin sangría externa</p>',
    );

    expect(description).toContain('margin-inline-start: 3rem');
    expect(description).toContain('data-indent="2"');
    expect(description).not.toContain('100px');
    expect(description).not.toContain('color: red');
  });
});
