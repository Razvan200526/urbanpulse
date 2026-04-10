from typing import Any, Optional
import datetime
import uuid

from geoalchemy2.types import Geometry
from pgvector.sqlalchemy.vector import VECTOR
from sqlalchemy import ARRAY, Boolean, CheckConstraint, Column, DateTime, Double, ForeignKeyConstraint, Index, Integer, PrimaryKeyConstraint, String, Table, Text, Time, UniqueConstraint, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


t_geography_columns = Table(
    'geography_columns', Base.metadata,
    Column('f_table_catalog', String),
    Column('f_table_schema', String),
    Column('f_table_name', String),
    Column('f_geography_column', String),
    Column('coord_dimension', Integer),
    Column('srid', Integer),
    Column('type', Text),
    schema='public'
)


t_geometry_columns = Table(
    'geometry_columns', Base.metadata,
    Column('f_table_catalog', String(256, 'C')),
    Column('f_table_schema', String),
    Column('f_table_name', String),
    Column('f_geometry_column', String),
    Column('coord_dimension', Integer),
    Column('srid', Integer),
    Column('type', String(30)),
    schema='public'
)


class SpatialRefSys(Base):
    __tablename__ = 'spatial_ref_sys'
    __table_args__ = (
        CheckConstraint('srid > 0 AND srid <= 998999', name='spatial_ref_sys_srid_check'),
        PrimaryKeyConstraint('srid', name='spatial_ref_sys_pkey'),
        {'schema': 'public'}
    )

    srid: Mapped[int] = mapped_column(Integer, primary_key=True)
    auth_name: Mapped[Optional[str]] = mapped_column(String(256))
    auth_srid: Mapped[Optional[int]] = mapped_column(Integer)
    srtext: Mapped[Optional[str]] = mapped_column(String(2048))
    proj4text: Mapped[Optional[str]] = mapped_column(String(2048))


class User(Base):
    __tablename__ = 'user'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='user_pkey'),
        UniqueConstraint('email', name='user_email_unique'),
        Index('user_home_location_spatial_index', 'homeLocation', postgresql_using='gist'),
        Index('user_last_known_location_spatial_index', 'lastKnownLocation', postgresql_using='gist'),
        {'schema': 'public'}
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    emailVerified: Mapped[bool] = mapped_column(Boolean, nullable=False)
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    updatedAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    heroAlertRadiusMeters: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('500'))
    image: Mapped[Optional[str]] = mapped_column(Text)
    role: Mapped[Optional[str]] = mapped_column(Text, server_default=text("'user'::text"))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    trustScore: Mapped[Optional[float]] = mapped_column(Double(53), server_default=text('0'))
    successfulInteractions: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))
    isVerified: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    rememberMe: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    banned: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    banReason: Mapped[Optional[str]] = mapped_column(Text)
    banExpires: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    homeLocation: Mapped[Optional[Any]] = mapped_column(Geometry('POINT', dimension=2, from_text='ST_GeomFromEWKT', name='geometry'))
    lastKnownLocation: Mapped[Optional[Any]] = mapped_column(Geometry('POINT', dimension=2, from_text='ST_GeomFromEWKT', name='geometry'))
    lastKnownLocationUpdatedAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    account: Mapped[list['Account']] = relationship('Account', back_populates='user')
    notification: Mapped[list['Notification']] = relationship('Notification', back_populates='user')
    pulse: Mapped[list['Pulse']] = relationship('Pulse', back_populates='user')
    quiet_hours: Mapped[list['QuietHours']] = relationship('QuietHours', back_populates='user')
    resources: Mapped[list['Resources']] = relationship('Resources', back_populates='user')
    session: Mapped[list['Session']] = relationship('Session', back_populates='user')
    skill: Mapped[list['Skill']] = relationship('Skill', back_populates='user')
    pulse_confirmation: Mapped[list['PulseConfirmation']] = relationship('PulseConfirmation', back_populates='user')
    report_reporterId: Mapped[list['Report']] = relationship('Report', foreign_keys='[Report.reporterId]', back_populates='user')
    report_targetUserId: Mapped[list['Report']] = relationship('Report', foreign_keys='[Report.targetUserId]', back_populates='user_')
    response: Mapped[list['Response']] = relationship('Response', back_populates='user')
    transaction_borrowerId: Mapped[list['Transaction']] = relationship('Transaction', foreign_keys='[Transaction.borrowerId]', back_populates='user')
    transaction_lenderId: Mapped[list['Transaction']] = relationship('Transaction', foreign_keys='[Transaction.lenderId]', back_populates='user_')
    conversation_member: Mapped[list['ConversationMember']] = relationship('ConversationMember', back_populates='user')
    message: Mapped[list['Message']] = relationship('Message', back_populates='user')
    resource_review_revieweeId: Mapped[list['ResourceReview']] = relationship('ResourceReview', foreign_keys='[ResourceReview.revieweeId]', back_populates='user')
    resource_review_reviewerId: Mapped[list['ResourceReview']] = relationship('ResourceReview', foreign_keys='[ResourceReview.reviewerId]', back_populates='user_')
    message_receipt: Mapped[list['MessageReceipt']] = relationship('MessageReceipt', back_populates='user')


class Verification(Base):
    __tablename__ = 'verification'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='verification_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    identifier: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    expiresAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    createdAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    updatedAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)


class Account(Base):
    __tablename__ = 'account'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='account_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='account_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    accountId: Mapped[str] = mapped_column(Text, nullable=False)
    providerId: Mapped[str] = mapped_column(Text, nullable=False)
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    updatedAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    accessToken: Mapped[Optional[str]] = mapped_column(Text)
    refreshToken: Mapped[Optional[str]] = mapped_column(Text)
    idToken: Mapped[Optional[str]] = mapped_column(Text)
    accessTokenExpiresAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    refreshTokenExpiresAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    scope: Mapped[Optional[str]] = mapped_column(Text)
    password: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['User'] = relationship('User', back_populates='account')


class Notification(Base):
    __tablename__ = 'notification'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='notification_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='notification_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))

    user: Mapped['User'] = relationship('User', back_populates='notification')


class Pulse(Base):
    __tablename__ = 'pulse'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='pulse_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='pulse_pkey'),
        Index('spatial_index', 'location', postgresql_using='gist'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    type: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'Emergency'::text"))
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[Any] = mapped_column(Geometry('POINT', dimension=2, from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'ACTIVE'::text"))
    pulseUploadState: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'pending'::text"))
    imageUrls: Mapped[list[str]] = mapped_column(ARRAY(Text()), nullable=False, server_default=text("'{}'::text[]"))
    isResolved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    requestedSkillTags: Mapped[list[str]] = mapped_column(ARRAY(Text()), nullable=False, server_default=text("'{}'::text[]"))
    matchMetadata: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    description: Mapped[Optional[str]] = mapped_column(Text)
    audioUrl: Mapped[Optional[str]] = mapped_column(Text)
    isVerified: Mapped[Optional[bool]] = mapped_column(Boolean)
    mergedIntoPulseId: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    moderationNote: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['User'] = relationship('User', back_populates='pulse')
    conversation: Mapped[list['Conversation']] = relationship('Conversation', back_populates='pulse')
    pet_alert: Mapped[list['PetAlert']] = relationship('PetAlert', back_populates='pulse')
    pulse_confirmation: Mapped[list['PulseConfirmation']] = relationship('PulseConfirmation', back_populates='pulse')
    report: Mapped[list['Report']] = relationship('Report', back_populates='pulse')
    response: Mapped[list['Response']] = relationship('Response', back_populates='pulse')


class QuietHours(Base):
    __tablename__ = 'quiet_hours'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='quiet_hours_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='quiet_hours_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    startTime: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    endTime: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    days: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped['User'] = relationship('User', back_populates='quiet_hours')


class Resources(Base):
    __tablename__ = 'resources'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='resources_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='resources_pkey'),
        Index('resource_spatial_index', 'location', postgresql_using='gist'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    availability: Mapped[str] = mapped_column(Text, nullable=False)
    imageUrls: Mapped[list[str]] = mapped_column(ARRAY(Text()), nullable=False, server_default=text("'{}'::text[]"))
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    location: Mapped[Any] = mapped_column(Geometry('POINT', dimension=2, from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False)
    resourceType: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    locationLabel: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['User'] = relationship('User', back_populates='resources')
    transaction: Mapped[list['Transaction']] = relationship('Transaction', back_populates='resources')
    resource_review: Mapped[list['ResourceReview']] = relationship('ResourceReview', back_populates='resources')


class Session(Base):
    __tablename__ = 'session'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='session_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='session_pkey'),
        UniqueConstraint('token', name='session_token_unique'),
        {'schema': 'public'}
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    expiresAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    token: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    updatedAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    ipAddress: Mapped[Optional[str]] = mapped_column(Text)
    userAgent: Mapped[Optional[str]] = mapped_column(Text)
    impersonatedBy: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped['User'] = relationship('User', back_populates='session')


class Skill(Base):
    __tablename__ = 'skill'
    __table_args__ = (
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='skill_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='skill_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    tag: Mapped[str] = mapped_column(Text, nullable=False)
    userId: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped['User'] = relationship('User', back_populates='skill')


class Conversation(Base):
    __tablename__ = 'conversation'
    __table_args__ = (
        ForeignKeyConstraint(['pulseId'], ['public.pulse.id'], ondelete='SET NULL', name='conversation_pulseId_pulse_id_fk'),
        PrimaryKeyConstraint('id', name='conversation_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    type: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    pulseId: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    pulse: Mapped[Optional['Pulse']] = relationship('Pulse', back_populates='conversation')
    conversation_member: Mapped[list['ConversationMember']] = relationship('ConversationMember', back_populates='conversation')
    message: Mapped[list['Message']] = relationship('Message', back_populates='conversation')


class PetAlert(Base):
    __tablename__ = 'pet_alert'
    __table_args__ = (
        ForeignKeyConstraint(['pulseId'], ['public.pulse.id'], ondelete='CASCADE', name='pet_alert_pulseId_pulse_id_fk'),
        PrimaryKeyConstraint('id', name='pet_alert_pkey'),
        Index('pet_alert_image_embedding_cosine_idx', 'imageEmbedding', postgresql_ops={'imageEmbedding': 'vector_cosine_ops'}, postgresql_using='hnsw'),
        Index('pet_alert_pulse_id_unique', 'pulseId', unique=True),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    pulseId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    petType: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str] = mapped_column(Text, nullable=False)
    embeddingStatus: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'pending'::text"))
    alertType: Mapped[str] = mapped_column(Text, nullable=False)
    breed: Mapped[Optional[str]] = mapped_column(Text)
    imageUrl: Mapped[Optional[str]] = mapped_column(Text)
    aiDescriptor: Mapped[Optional[str]] = mapped_column(Text)
    imageEmbedding: Mapped[Optional[Any]] = mapped_column(VECTOR(768))
    embeddingModel: Mapped[Optional[str]] = mapped_column(Text)
    embeddingUpdatedAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    pulse: Mapped['Pulse'] = relationship('Pulse', back_populates='pet_alert')
    pet_match_foundAlertId: Mapped[list['PetMatch']] = relationship('PetMatch', foreign_keys='[PetMatch.foundAlertId]', back_populates='pet_alert')
    pet_match_lostAlertId: Mapped[list['PetMatch']] = relationship('PetMatch', foreign_keys='[PetMatch.lostAlertId]', back_populates='pet_alert_')


class PulseConfirmation(Base):
    __tablename__ = 'pulse_confirmation'
    __table_args__ = (
        ForeignKeyConstraint(['pulseId'], ['public.pulse.id'], ondelete='CASCADE', name='pulse_confirmation_pulseId_pulse_id_fk'),
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='pulse_confirmation_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='pulse_confirmation_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    pulseId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    confirmedAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))

    pulse: Mapped['Pulse'] = relationship('Pulse', back_populates='pulse_confirmation')
    user: Mapped['User'] = relationship('User', back_populates='pulse_confirmation')


class Report(Base):
    __tablename__ = 'report'
    __table_args__ = (
        ForeignKeyConstraint(['reporterId'], ['public.user.id'], ondelete='CASCADE', name='report_reporterId_user_id_fk'),
        ForeignKeyConstraint(['targetPulseId'], ['public.pulse.id'], ondelete='CASCADE', name='report_targetPulseId_pulse_id_fk'),
        ForeignKeyConstraint(['targetUserId'], ['public.user.id'], ondelete='CASCADE', name='report_targetUserId_user_id_fk'),
        PrimaryKeyConstraint('id', name='report_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    reporterId: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'Pending'::text"))
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    targetUserId: Mapped[Optional[str]] = mapped_column(Text)
    targetPulseId: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)

    user: Mapped['User'] = relationship('User', foreign_keys=[reporterId], back_populates='report_reporterId')
    pulse: Mapped[Optional['Pulse']] = relationship('Pulse', back_populates='report')
    user_: Mapped[Optional['User']] = relationship('User', foreign_keys=[targetUserId], back_populates='report_targetUserId')


class Response(Base):
    __tablename__ = 'response'
    __table_args__ = (
        ForeignKeyConstraint(['pulseId'], ['public.pulse.id'], ondelete='CASCADE', name='response_pulseId_pulse_id_fk'),
        ForeignKeyConstraint(['responderId'], ['public.user.id'], ondelete='CASCADE', name='response_responderId_user_id_fk'),
        PrimaryKeyConstraint('id', name='response_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    pulseId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    responderId: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))

    pulse: Mapped['Pulse'] = relationship('Pulse', back_populates='response')
    user: Mapped['User'] = relationship('User', back_populates='response')


class Transaction(Base):
    __tablename__ = 'transaction'
    __table_args__ = (
        ForeignKeyConstraint(['borrowerId'], ['public.user.id'], ondelete='SET NULL', name='transaction_borrowerId_user_id_fk'),
        ForeignKeyConstraint(['lenderId'], ['public.user.id'], ondelete='SET NULL', name='transaction_lenderId_user_id_fk'),
        ForeignKeyConstraint(['resourceId'], ['public.resources.id'], ondelete='CASCADE', name='transaction_resourceId_resources_id_fk'),
        PrimaryKeyConstraint('id', name='transaction_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    resourceId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    startAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    borrowerId: Mapped[Optional[str]] = mapped_column(Text)
    lenderId: Mapped[Optional[str]] = mapped_column(Text)
    endAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    user: Mapped[Optional['User']] = relationship('User', foreign_keys=[borrowerId], back_populates='transaction_borrowerId')
    user_: Mapped[Optional['User']] = relationship('User', foreign_keys=[lenderId], back_populates='transaction_lenderId')
    resources: Mapped['Resources'] = relationship('Resources', back_populates='transaction')
    resource_review: Mapped['ResourceReview'] = relationship('ResourceReview', uselist=False, back_populates='transaction')


class ConversationMember(Base):
    __tablename__ = 'conversation_member'
    __table_args__ = (
        ForeignKeyConstraint(['conversationId'], ['public.conversation.id'], ondelete='CASCADE', name='conversation_member_conversationId_conversation_id_fk'),
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='conversation_member_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='conversation_member_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    conversationId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    userId: Mapped[str] = mapped_column(Text, nullable=False)

    conversation: Mapped['Conversation'] = relationship('Conversation', back_populates='conversation_member')
    user: Mapped['User'] = relationship('User', back_populates='conversation_member')


class Message(Base):
    __tablename__ = 'message'
    __table_args__ = (
        ForeignKeyConstraint(['conversationId'], ['public.conversation.id'], ondelete='CASCADE', name='message_conversationId_conversation_id_fk'),
        ForeignKeyConstraint(['senderId'], ['public.user.id'], ondelete='CASCADE', name='message_senderId_user_id_fk'),
        PrimaryKeyConstraint('id', name='message_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    conversationId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    senderId: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sentAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))

    conversation: Mapped['Conversation'] = relationship('Conversation', back_populates='message')
    user: Mapped['User'] = relationship('User', back_populates='message')
    message_receipt: Mapped[list['MessageReceipt']] = relationship('MessageReceipt', back_populates='message')


class PetMatch(Base):
    __tablename__ = 'pet_match'
    __table_args__ = (
        ForeignKeyConstraint(['foundAlertId'], ['public.pet_alert.id'], ondelete='CASCADE', name='pet_match_foundAlertId_pet_alert_id_fk'),
        ForeignKeyConstraint(['lostAlertId'], ['public.pet_alert.id'], ondelete='CASCADE', name='pet_match_lostAlertId_pet_alert_id_fk'),
        PrimaryKeyConstraint('id', name='pet_match_pkey'),
        Index('pet_match_lost_found_unique', 'lostAlertId', 'foundAlertId', unique=True),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    lostAlertId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    foundAlertId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    confidenceScore: Mapped[float] = mapped_column(Double(53), nullable=False)
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    imageSimilarity: Mapped[float] = mapped_column(Double(53), nullable=False)
    matchedAttributes: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    pet_alert: Mapped['PetAlert'] = relationship('PetAlert', foreign_keys=[foundAlertId], back_populates='pet_match_foundAlertId')
    pet_alert_: Mapped['PetAlert'] = relationship('PetAlert', foreign_keys=[lostAlertId], back_populates='pet_match_lostAlertId')


class ResourceReview(Base):
    __tablename__ = 'resource_review'
    __table_args__ = (
        ForeignKeyConstraint(['resourceId'], ['public.resources.id'], ondelete='CASCADE', name='resource_review_resourceId_resources_id_fk'),
        ForeignKeyConstraint(['revieweeId'], ['public.user.id'], ondelete='CASCADE', name='resource_review_revieweeId_user_id_fk'),
        ForeignKeyConstraint(['reviewerId'], ['public.user.id'], ondelete='CASCADE', name='resource_review_reviewerId_user_id_fk'),
        ForeignKeyConstraint(['transactionId'], ['public.transaction.id'], ondelete='CASCADE', name='resource_review_transactionId_transaction_id_fk'),
        PrimaryKeyConstraint('id', name='resource_review_pkey'),
        UniqueConstraint('transactionId', name='resource_review_transactionId_unique'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    transactionId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    resourceId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    reviewerId: Mapped[str] = mapped_column(Text, nullable=False)
    revieweeId: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    createdAt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    comment: Mapped[Optional[str]] = mapped_column(Text)

    resources: Mapped['Resources'] = relationship('Resources', back_populates='resource_review')
    user: Mapped['User'] = relationship('User', foreign_keys=[revieweeId], back_populates='resource_review_revieweeId')
    user_: Mapped['User'] = relationship('User', foreign_keys=[reviewerId], back_populates='resource_review_reviewerId')
    transaction: Mapped['Transaction'] = relationship('Transaction', back_populates='resource_review')


class MessageReceipt(Base):
    __tablename__ = 'message_receipt'
    __table_args__ = (
        ForeignKeyConstraint(['messageId'], ['public.message.id'], ondelete='CASCADE', name='message_receipt_messageId_message_id_fk'),
        ForeignKeyConstraint(['userId'], ['public.user.id'], ondelete='CASCADE', name='message_receipt_userId_user_id_fk'),
        PrimaryKeyConstraint('id', name='message_receipt_pkey'),
        Index('message_receipt_message_user_unique', 'messageId', 'userId', unique=True),
        Index('message_receipt_user_message_index', 'userId', 'messageId'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    messageId: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    userId: Mapped[str] = mapped_column(Text, nullable=False)
    deliveredAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    readAt: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    message: Mapped['Message'] = relationship('Message', back_populates='message_receipt')
    user: Mapped['User'] = relationship('User', back_populates='message_receipt')
