import GroupMembersTable from "../../../admin/components/membership/GroupMembersTable";

export default function MyGroupMembersSection({
  currentStudentId,
  isCaptain = false,
  canEditRank = false,
  members,
  onChanged,
  showRankCriteria = false,
  compactRank = false
}) {
  return (
    <div className="space-y-3">
      <GroupMembersTable
        members={members}
        canEditRole={isCaptain}
        canEditRank={canEditRank}
        canRemoveMember={isCaptain}
        canRemoveRow={(row) => String(row?.student_id) !== String(currentStudentId)}
        onChanged={onChanged}
        highlightStudentId={currentStudentId || null}
        showMembershipId={false}
        showRankCriteria={showRankCriteria}
        compactRank={compactRank}
      />
    </div>
  );
}
